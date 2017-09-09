const Koa = require('koa');
const app = new Koa();

app.use(require('koa-static')('./www', {}));

app.listen(3000);
