const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')

const index = require('./routes/index')
const users = require('./routes/users')
const logUtil = require('./utils/log_util')
const api = require('./routes/api')
const response_formatter = require('./middlewares/response_formatter')

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

app.use(async (ctx, next) => {
  //响应开始时间
  const start = new Date();
  //响应间隔时间
  var ms;
  try {
    //开始进入到下一个中间件
    await next();

    ms = new Date() - start;
    //记录响应日志
    logUtil.logResponse(ctx, ms);

  } catch (error) {
    
    ms = new Date() - start;
    //记录异常日志
    logUtil.logError(ctx, error, ms);
  }

});

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())

app.use(response_formatter('^/api'))

router.use('/', index.routes(), index.allowedMethods())
router.use('./users', users.routes(), users.allowedMethods())
router.use('./api', api.routes(), api.allowedMethods())

app.use(router.routes(), routes.allowedMethods())
router.use('/api', api.routes(), api.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
