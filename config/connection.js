const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
     const url='mongodb+srv://vidhya:vidhya@cluster0.9jgqgqh.mongodb.net/?retryWrites=true&w=majority'
    //  const url='mongodb+srv://vidhyadb:vidhyadb@cluster0.pjlpwnf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    
    const dbname='vidhya'
    mongoClient.connect(url, {useUnifiedTopology: true,useNewUrlParser: true },(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
}
module.exports.get=function(){
    return state.db
}
