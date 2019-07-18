const express = require('express')
const path = require('path')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const moment = require('moment')
const port = process.env.PORT || 3001

//os arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')))
//setando o ejs como minha view engine, as minhas views estão em /views
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

const Twit = require('twit')
const T = new Twit({
    consumer_key: 'W6KDDWYVfkjQJIRFyaCvaaKEu',
    consumer_secret: 'fBtd6cucFRmwrk3dpzAXsDHZEgl6uCOe5RhLiclDG3kK6E1pGA',
    access_token: '1103376116562231296-b5J7iVMzlm4XjSqctEXFVSZ42His8S',
    access_token_secret: 'HDHNJavDbZ1mvytlwPAs0YyZTjqC5VRj0QDRiCTs6CW4a',
    timeout_ms: 60 * 1000//1 minuto
})

const streams = {}

const createStream = (term) => {
    //invéz de ficar perguntando toda hora se ele tem um tweet novo sobre algum assunto, 
    //podemos criar um stream, e recebemos notificações sobre alguma coisa que esta sendo publicada
    //podemos filtrar por palavra por exemplo track: 'apple'
    const stream = T.stream('statuses/filter', { track: term })
    stream.on('connect', req => {
        //console.log(req)
    })
    stream.on('tweet', tweet => {

        const date = new Date(parseInt(tweet.timestamp_ms))
        var dateString = moment(date).locale('pt-BR').format(' HH:mm:ss DD/MM/YYYY');

        //io.emit('tweet', { etc...
        //na sala que quero mandar esse termo
        io.to(term).emit('tweet', {
            'username': tweet.user.screen_name,
            'name': tweet.user.name,
            'image': tweet.user.profile_image_url,
            'text': tweet.text,
            'date': dateString,
            'verified':tweet.user.verified,
            term
        })
    })
    streams[term] = stream
}

//se alguem se conectar a mesma sala, ele vai aproveitar o mesmo stream, para dois clientes 
//quando os dois sairem, preciso deletar esse stream
//mas precisa verificar se tem alguem nessa sala
const checkStreams = ()=>{
    const terms = Object.keys(streams)
    console.log('terms',terms)
    const removeTerms = terms.filter(term =>{
        //vamos verificar se tem esse termo nas salas
        //caso contrario a sala não exite, e pode apagar esse stream
        if(!(term in io.sockets.adapter.rooms)){
            return term
        }
    })
    console.log('removeTerms',removeTerms)
    removeTerms.map(term=>{
        streams[term].stop()//parar esse stream
        delete streams[term]//e deletamos
    })
}

//conceito de salas/rooms
//por padrão ele cria uma sala com o id do usuario
//se quisermos algo ao usuario, enviamos para esse id
//se quiser mandar para uma sala com mais pessoas, mandamos para sala com mais pessoas
io.on('connection', socket => {//socket ou client
    console.log(socket.id)

    //e preciso receber via socket a informação do cliente
    socket.on('startStream', term => {
        //se ainda não existe esse termo
        if (!(term in streams)) {
            createStream(term)
        }
        //todo mundo que entra no sistema, quero que entre em uma sala especifica
        //se juntar a este termo
        socket.join(term)
        console.log('rooms',io.sockets.adapter.rooms)
        //console.log(streams)
    })

    socket.on('removeTerm', term => {
        socket.leave(term);
        console.log('rooms',io.sockets.adapter.rooms)
    })

    socket.on('disconnect', reason => {
        //consigo saber a razão que ele se desconectou
        //console.log(reason)//ex transport close, fechou o meio de conexão
        checkStreams()
        console.log(streams)
    })
})

app.get('/', (req, res) => {
    res.render('index')
})

http.listen(port, () => {
    console.log('Servidor rodando...')
})