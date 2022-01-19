const MAX_RAND_NUMBER=1000

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomNumbers(cant){
    let ocurrencias = {}
    
    for(var i = 0; i < cant; i++){
        const numero = getRandomInt(MAX_RAND_NUMBER)
        ocurrencias[numero] = ocurrencias[numero] ? ocurrencias[numero] + 1 : 1
    }
    return ocurrencias
}


process.on('message', cant => {
    const numbers = getRandomNumbers(cant)
    process.send(numbers)
})
