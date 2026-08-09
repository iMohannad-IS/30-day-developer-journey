const auth = (req,res,next)=>{
    const apiKey = req.headers["x-api-key"];

    if(apiKey!=="123456"){
      return res.status(401).json({
            message: "Unauthorized"
        });
    }
    next();
};
module.exports=auth;
/*
req.headers
 يأخذ المفتاح من الـRequest:
ويقول:

هل المفتاح يساوي 12345؟

*/