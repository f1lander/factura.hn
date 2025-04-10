import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

export const NewInvoiceLoadingSkeleton = () => (
  <Card className='card-invoice border-none shadow-none rounded-sm flex flex-col min-h-[90vh]'>
    <CardHeader className='flex border flex-col items-end justify-between bg-muted/50 shrink-0 gap-2'>
      <div className='flex flex-col lg:flex-row items-start w-full justify-between bg-muted/50 shrink-0 gap-3'>
        <div className='grid gap-0.5'>
          <div className='h-6 w-32 bg-muted animate-pulse rounded' />
          <div className='h-4 w-48 bg-muted animate-pulse rounded' />
        </div>
        <div className='h-6 w-24 bg-muted animate-pulse rounded' />
      </div>
    </CardHeader>
    <CardContent className='p-6 text-sm flex-1'>
      <div className='space-y-6'>
        {/* Top buttons skeleton */}
        <div className='flex items-center justify-end lg:justify-between gap-4'>
          <div className='h-10 w-40 bg-muted animate-pulse rounded' />
          <div className='h-10 w-32 bg-muted animate-pulse rounded' />
        </div>

        {/* Customer search and date picker skeleton */}
        <div className='flex gap-4'>
          <div className='h-10 w-3/4 bg-muted animate-pulse rounded' />
          <div className='h-10 w-1/4 bg-muted animate-pulse rounded' />
        </div>
        <div className='h-10 w-48 bg-muted animate-pulse rounded' />

        {/* Invoice number fields skeleton */}
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1 space-y-2'>
            <div className='h-4 w-24 bg-muted animate-pulse rounded' />
            <div className='h-10 w-full bg-muted animate-pulse rounded' />
          </div>
          <div className='flex-1 space-y-2'>
            <div className='h-4 w-24 bg-muted animate-pulse rounded' />
            <div className='h-10 w-full bg-muted animate-pulse rounded' />
          </div>
          <div className='flex-1 space-y-2'>
            <div className='h-4 w-24 bg-muted animate-pulse rounded' />
            <div className='h-10 w-full bg-muted animate-pulse rounded' />
          </div>
        </div>

        {/* Add item button skeleton */}
        <div className='h-10 w-full bg-muted animate-pulse rounded' />

        {/* Invoice items skeleton */}
        <div className='space-y-4'>
          {[1, 2].map((_, index) => (
            <Card key={index} className='shadow-sm'>
              <CardHeader className='p-4'>
                <div className='h-6 w-32 bg-muted animate-pulse rounded' />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </CardContent>
    <CardFooter className='flex flex-row items-center justify-between border-t bg-muted/50 px-6 py-3 shrink-0'>
      <div className='h-4 w-48 bg-muted animate-pulse rounded' />
      <div className='h-6 w-24 bg-muted animate-pulse rounded' />
    </CardFooter>
  </Card>
);
