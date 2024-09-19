interface BannerProps {
  message: string;
  variant: Variant;
}

type Variant = "error" | "success";

export default function Banner({ message, variant }: BannerProps) {
  const variants = {
    error: "bg-[#E57373]",
    success: "bg-[#4CAF50]",
  };
  return (
    <div
      className={`flex sticky items-center justify-center py-2 ${variants[variant]}`}
    >
      {message}
    </div>
  );
}
