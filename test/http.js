const http = require('http')
const url  = require('url')
const EventEmit = require('events')

const request = {
  get query(){
    return url.parse(this.request.url, true).query
  }
}

const response = {
  get body() {
    return this._body
  },
  set body(data){
    this._body = data
  },
  get status(){
    return this.res.statusCode
  },
  set status(code){
    this.res.status = code
  }

}

const ctx = {}

const ctxGetter = {
  request: ['query'],
  response: ['body', 'status'],
}

const ctxSetter = {
  response: ['body', 'status'],
}

const __defineProxyGetter__ = (prop, name) =>new Proxy({
  get(){
    return this[prop][name]
  }
}, ctx)

const __defineProxySetter__ = (prop, name) => new Proxy({
  set(val){
    this[prop][name] = val
  }
}, ctx)

Object.keys(ctxGetter)
  .forEach(prop => 
    ctxGetter[prop].forEach(name => 
      __defineProxyGetter__(prop, name)))

Object.keys(ctxSetter)
  .forEach(prop => 
    ctxGetter[prop].forEach(name=>
      __defineProxySetter__(prop, name)))


  const compose = ctx => async middlewares =>
  await middlewares.reduceRight(
    (next, middleware) =>
      (next = ((ctx, middleware, oldNext) => async () => await middleware(ctx, oldNext))(
        ctx,
        middleware,
        next,
      )),
    async () => Promise.resolve(),
  )()

class App extends EventEmit {
  constructor() {
    super()

    this.middleware = []
    this.ctx = ctx
    this.request = request
    this.response = response
  }

  use(fn) {
    this.middleware.push(fn)
  }

  onerror(err, ctx){
    this.emit('error', err)

    ctx.res.end(err.message || 'Ooooooops Error.')
  }

  createContext(request, response){
    const ctx = Object.create(this.ctx)
  
    ctx.request = Object.create(this.request)
    ctx.response = Object.create(this.response)
    
    ctx.req = request
    ctx.res = response
  
    return ctx
  }
  
  httpCreateServer() {
    return (...httpServerArgs) => {
      const ctx = this.createContext(...httpServerArgs)

      return compose(ctx)(this.middleware)
      .then(() => this.responseBody(ctx))
      .catch((err) => this.onerror(err, ctx))
    }
  }
  
  responseBody(ctx){
    const body = ctx.body || 'hello world'
  
    if(typeof body === 'string'){
      ctx.res.end(body)
    }
    if(typeof body === 'object'){
      ctx.res.end(JSON.stringify(body))
    }
  }

  listen(...args) {
    http
      .createServer(this.httpCreateServer())
      .listen(...args)
  }
}

const app = new App()

app.use(async (ctx, next) => {
  console.log(1)
  await next()
  ctx.body = 'hello world'
  console.log(4)
})
app.use(async (ctx, next) => {
  console.log(2)

  await next()
  console.log(3)
})

app.on('error', err => {
  console.log(err, 'had been catched')
})

// app.use(({
//     httpVersion,
//     headers,
//     method,
//     url,
//     trailers,
//     complete
//   }, res) => {
//     console.log(httpVersion, headers, method, url, trailers, complete)

//     res.writeHead(200, {'Content-Type':'text/html'})
//     res.write('Hello World')
//   })

// listen
app.listen(3000, () => console.log('server is running at: localhost:3000'))