-- Link invoice_id to invoice table and remove when invoice items are deliveried
create or replace function update_product_stock(register_order_id uuid)
returns void
language plpgsql
security definer
as $$
DECLARE
    product_record JSONB;
    product_id UUID;
    quantity_delta INT;
    update_products JSONB;
    operation_type TEXT;
    invoice_id UUID;
BEGIN
    -- Ensure the register_order_id exists and get invoice_id if exists
    SELECT pro.update_products, pro.type, pro.invoice_id
    INTO update_products, operation_type, invoice_id
    FROM product_register_orders pro
    WHERE pro.id = register_order_id;

    IF update_products IS NULL THEN
        RAISE EXCEPTION 'Register order ID % does not exist', register_order_id;
    END IF;

    -- Process products
    FOR product_record IN SELECT * FROM jsonb_array_elements(update_products) LOOP
        -- Extract product_id and quantity_delta from the JSONB object
        product_id := (product_record->>'product_id')::UUID;
        quantity_delta := (product_record->>'quantity_delta')::INT;

        -- Check if the product exists and is not archived
        IF NOT EXISTS (
            SELECT 1 FROM products p WHERE p.id = product_id OR p.archived = TRUE
        ) THEN
            RAISE EXCEPTION 'Product ID % does not exist or is archived', product_id;
        END IF;

        -- Perform operation based on the operation_type from the product_register_orders table
        IF operation_type = 'ADD' THEN
            -- Add quantity to the stock
            UPDATE products
            SET quantity_in_stock = COALESCE(quantity_in_stock, 0) + quantity_delta
            WHERE id = product_id;
        ELSIF operation_type = 'DELETE' THEN
            -- Ensure quantity to delete does not exceed existing stock
            IF (SELECT quantity_in_stock FROM products WHERE id = product_id) < quantity_delta THEN
                RAISE EXCEPTION 'Cannot remove more than existing quantity for Product ID %', product_id;
            END IF;

            -- Subtract quantity from the stock
            UPDATE products
            SET quantity_in_stock = quantity_in_stock - quantity_delta
            WHERE id = product_id;
        ELSE
            RAISE EXCEPTION 'Invalid operation type % for Product ID %', operation_type, product_id;
        END IF;
    END LOOP;

    -- Update invoice if exists
    IF invoice_id IS NOT NULL THEN
        UPDATE invoices
        SET 
            delivered_date = CURRENT_TIMESTAMP,
            reg_order_id = register_order_id
        WHERE id = invoice_id;
    END IF;

    -- Mark order as processed
    UPDATE product_register_orders
    SET processed = true
    WHERE id = register_order_id;

    RETURN;
END;
$$;