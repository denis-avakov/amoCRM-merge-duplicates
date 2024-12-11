const PORT = process.env.PORT || 3000;

Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/') {
      return new Response('Hey!');
    }

    return new Response('404!');
  },
});

console.log(`Server running at http://localhost:${PORT}`);
