export const loader = async () => {
  const data = { message: "Hello, API!" };
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
