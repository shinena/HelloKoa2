var response_formatter = async (ctx, next)=>{
  await next()
  if(ctx.body){
    ctx.body= {
      code: 0,
      message: 'success',
      data:ctx.body
    }
  } else{
    ctx.body = {
      code: 0,
      message:'success'
    }
  }
}
var url_filter = function(pattern){
  return async function(ctx, next){
    var reg = new RegExp(pattern)
    await next()
    if(reg.test(ctx.originalUrl)){
      response_formatter(ctx)
    }
  }
}
module.exports = url_filter