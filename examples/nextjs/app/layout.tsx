export const metadata = {
  title: "Video.js + FastPix Data — Next.js",
  description: "FastPix Video Data SDK monitoring a Video.js player in Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
