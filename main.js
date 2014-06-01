window.addEventListener('load', main, false);

function main() {
    /**********************
    //Maybe try least squares difference
    //to make 'smooth' wave animations 
    //more common.
    **********************/

    window.AudioContext = window.webkitAudioContext || window.AudioContext;
    if (!window.AudioContext) {
        document.write("Your browser does not support the Web Audio API. Try updating your browser or using a different one.");
        return;
    }

    var elem = document.body; // Make the body go full screen.

    /*Initializing Graphics*/
    var canvas = document.getElementById('canvas');
    var graphicsContext = canvas.getContext('2d');
    graphicsContext.translate(0, canvas.height / 2);
    graphicsContext.transform(1, 0, 0, -1, 0, 0);

    /*Connecting and initializing audio*/
    var audioContext = new AudioContext();
    var masterGain = audioContext.createGain();
    var analyser = audioContext.createAnalyser();
    masterGain.connect(analyser);
    analyser.connect(audioContext.destination);

    /*Creating synth and mapping notes to keys.*/
    var synth = new Synth({context: audioContext,
                           destination: masterGain,
                           type: 'sine',
                           modulationIntensity: 0,
                           modulationRate: 11});
    synth.makeNotes("C4", 21);

    synth.mapToKeys(65, //a
                    87, //w
                    83, //s
                    69, //e
                    68, //d
                    70, //f
                    84, //t
                    71, //g
                    89, //y
                    72, //h
                    85, //u
                    74, //j
                    75, //k
                    79, //o
                    76, //l
                    80, //p
                    186, //;
                    222, //'
                    221, //]
                    13, //return
                    220 //\
                    );

    synth.mapKeyToFunction(49, function() { //1
        synth.type = 'sine';
        synth.refreshType();
    });

    synth.mapKeyToFunction(50, function() { //2
        synth.type = 'square';
        synth.refreshType();
    });

    synth.mapKeyToFunction(51, function() { //3
        synth.type = 'sawtooth';
        synth.refreshType();
    });

    synth.mapKeyToFunction(52, function() { //4
        synth.type = 'triangle';
        synth.refreshType();
    });

    synth.mapKeyToFunction(38, function() { //up
        synth.root += 12;
        synth.refreshFrequency();
    });

    synth.mapKeyToFunction(40, function() { //down
        synth.root -= 12;
        synth.refreshFrequency();
    })

    synth.mapKeyToFunction(39, function() { //left
        synth.decay *= 2;
        synth.refreshDecay();
    })

    synth.mapKeyToFunction(37, function() { //right
        synth.decay /= 2;
        synth.refreshDecay();
    })

    var modulationOn = false;
    synth.mapKeyToFunction(16, function() { //shift
        if (!modulationOn) {
            synth.modulationIntensity += 30;
            synth.refreshFrequency();
            modulationOn = true;
        }
    }, function() {
        if (modulationOn) {
            synth.modulationIntensity -= 30;
            synth.refreshFrequency();
            modulationOn = false;
        }
    });

    synth.mapKeyToFunction(48, function() { //0
        var elem = document.getElementById('canvas');

        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
    });

    setInterval(update, 33);

    function match(data1, data2, sampleSize) {
        var maxDot = 0;
        var maxIndex = -1;

        var randomIndices = [];
        for (var i = 0; i < sampleSize; i++) {
            randomIndices.push(Math.floor(Math.random() * data1.length * 3 / 4));
        }

        var randomIndex = 50;
        for (var i = 0; i < data1.length / 4; i++) {
            var currentDot = 0;

            for (var j = 0; j < sampleSize; j++) {
                currentDot += (data1[randomIndices[j] + i] - 128) * (data2[randomIndices[j]] - 128);
            }

            //for (var j = i; j < i + sampleSize; j++) {
                //currentDot += data1[j] * data2[j - i];
                //currentDot += data1[j + randomIndex] * data2[j - i + randomIndex];
            //}


            //currentDot = Math.abs(currentDot);
            if (maxIndex == -1 || maxDot < currentDot) {
                maxDot = currentDot;
                maxIndex = i;
            }

            //if (currentDot === 0)
                //break;

        }

        return maxIndex;
    }

    var previousTimeDomainData;

    /* if 1 time domain data is drawn
     * if -1 frequency domain data is drawn
     */
    var toggle = 1;
    function update() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        graphicsContext.translate(0, canvas.height / 2);
        graphicsContext.transform(1, 0, 0, -1, 0, 0);

        graphicsContext.clearRect(0, canvas.height / 2, canvas.width,-canvas.height);
        graphicsContext.fillRect(0, canvas.height / 2, canvas.width, -canvas.height);

        var timeDomainData = new Uint8Array(2048);
        var fftData = new Uint8Array(2048);

        analyser.getByteTimeDomainData(timeDomainData);
        analyser.getByteFrequencyData(fftData);

        var startIndex = 0;

        /* Matching the current TimeDomainData
         * to be closest to the old TimeDomainData
         */
        if (previousTimeDomainData)
            startIndex = match(timeDomainData, previousTimeDomainData, 200);

        timeDomainData = shiftUint8Array(timeDomainData, startIndex);

        previousTimeDomainData = timeDomainData;

        var color = fftToColor(fftData);
        /* If we have pressed the 
         * '=' key visualize the 
         * fftData. Otherwise
         * visualize the timeDomainData
         */

        if (toggle == 1)
            drawData(timeDomainData, color);
        else
            drawData(fftData, color);

        var imgData = graphicsContext.getImageData(0, canvas.height / 2, canvas.width, canvas.height);

        for (var i = 0; i < imgData.data.length; i += 4) {
            var staticConst = Math.random() * 2 - 1;
            /*red*/
            imgData.data[i] += staticConst;
            /*green*/
            imgData.data[i + 1] += staticConst;
            /*blue*/
            imgData.data[i + 2] += staticConst;
        }

        graphicsContext.putImageData(imgData, 0, canvas.height / 2);
    }

    function fftToColor(fftData) {

        /* We are mapping max amplitude to saturation
         * and the average of all non-zero frequencies
         * to hue. 
         */
        var amplitude = 0;
        var averageFrequencies = 0;
        var frequenyCount = 0;

        /* The number of non-zero frequencies */
        var frequenyCount = 0;

        for (var i = 0; i < fftData.length; i++) {
            if (fftData[i] >= amplitude) {
                amplitude = fftData[i];
                averageFrequencies += i;
                frequenyCount++;
            }
        }

        averageFrequencies = averageFrequencies/frequenyCount;

        return 'hsl(' + averageFrequencies * 50  + ', ' + amplitude + '%, 50%)';
    }

    function shiftUint8Array(array, startIndex) {
        var shiftedArray = new Uint8Array(array.length);
        for (var i = startIndex; i < array.length + startIndex; i++)
            shiftedArray[i - startIndex] = array[i % array.length];
        return shiftedArray;
    }

    function drawData(data, color) {
        //graphicsContext.strokeStyle = "#55BB77";
        graphicsContext.strokeStyle = color;

        graphicsContext.beginPath();
        graphicsContext.shadowBlur = 100 * (1 - Math.random() % 0.5);
        //graphicsContext.shadowColor = "#00AA55";
        graphicsContext.shadowColor = color;
        graphicsContext.shadowOffsetX = 5000;
        graphicsContext.shadowOffsetY = 0;
        graphicsContext.lineWidth = 5 * Math.random();
        graphicsContext.moveTo(-5000, 0);

        for (var i = 0; i < canvas.width; i++) {
            var y = (data[i] - 128);
            graphicsContext.lineTo(i * 2 - 5000, y*2);
        }

        graphicsContext.stroke();

        graphicsContext.beginPath();
        graphicsContext.shadowBlur = 0;
        graphicsContext.lineWidth = Math.random() + 1;
        graphicsContext.moveTo(0, 0);
        for (var i = 0; i < canvas.width; i++) {
            var y = (data[i] - 128);
            graphicsContext.lineTo(i * 2, y*2);
        }
        graphicsContext.stroke();
    }

    addEventListener('keydown', onKeyDown, false);
    function onKeyDown(e) {
        if (e.keyCode == 187)
            toggle *= -1;
    }
}