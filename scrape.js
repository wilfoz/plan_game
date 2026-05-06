import https from 'https';

https.get('https://www.elecnor.com.br/dist/assets/app-CGKQbkgF.css', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const vars = [...data.matchAll(/--[a-zA-Z0-9-]+:\s*([^;]+)/g)].map(m => m[0]);
    console.log('CSS Variables:', [...new Set(vars)].slice(0, 50));
  });
}).on('error', (e) => console.error(e));
