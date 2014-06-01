function Waves() {}

Waves.NOTES = {C:1, D:3, E:5, F:6, G:8, A:10, B:12,
                  Db:2,Eb:4,     Gb:7,Ab:9,Bb:11}

Waves.sine = function(t) {
    return Math.sin(t * Math.PI * 2);
}

/** Important parent functions **/
Waves.square = function(t) {
    return (Math.floor(t) % 2) - 0.5;
};

Waves.noise = function(t) {
    return Math.random() - 0.5;
};

Waves.sawtooth = function(t) {
    return (t % 1) - 0.5;
};

Waves.triangle = function(t) {
    return 2 * Math.abs(Waves.sawtooth(t)) - 0.5;
};

/* Waves.createWave
 *
 * Returns a function of time
 * that is one of the Waves types
 * above with a given frequency,
 * and volume.
 * 
 * Params fields:
 * @frequency - a function of time or double
 * @volume - a function of time or double
 * @type - a string
 * @shift - a float
 */
Waves.createWave = function(params) {
    var type = params.type;

    /**Frequency Controls**/
    var frequency = params.frequency;

    if (typeof params.frequency == "number")
        frequency = function() {
            return params.frequency;
        };

    /**Volume Controls**/
    var volume = params.volume;

    if (typeof params.volume == "number")
        volume = function() {
            return params.volume;
        };

    /**Frequency Defaults**/
    if (typeof params.frequency == "undefined")
        frequency = function() {
            return 440;
        };

    /**Volume Defaults**/
    if (typeof params.volume == "undefined")
        volume = function() {
            return 0.5;
        };

    /**Shift defaults**/
    if (typeof params.shift == "undefined")
        params.shift = 0;

    var waveFunction = function(t) {
        return volume(t) * Waves[type](t * frequency(t)) + params.shift;
    };

    return  waveFunction;
};

/* Waves.modulation
 *
 * Returns a function of time that acts as a
 * modulation function. Useful when you want to 
 * create modulated frequencies or volumes.
 *
 * Params fields:
 * @intensity - a number for now
 * @rate - a number for now
 * @shift - the vertical shift.
 */
Waves.modulate = function(params) {
    if (typeof params == "undefined") {
        params = {};
    }

    var modulationIntensity = params.intensity;
    var modulationRate = params.rate;
    var shift = params.shift;

    /**Defaults**/
    if (typeof params.intensity === "undefined")
        modulationIntensity = 1;

    if (typeof params.rate === "undefined")
        modulationRate = 11;

    if (typeof params.shift === "undefined")
        shift = 0;

    /**Function to be returned**/
    var modulationFunction = function(t) {
        return modulationIntensity * Math.sin(t * modulationRate * Math.PI * 2) + shift;
    };
    return modulationFunction;
};

/* Waves.getChromaticFrequency
 *
 * Returns the frequency of a chromatic
 * note. 
 *
 * @noteID - string or int, either the 
 * "<Note><Octave>" format or number
 * of notes from C0.
 */
Waves.getChromaticFrequency = function(noteID) {
    if (typeof noteID === 'undefined')
        throw "Waves.getChromaticFrequencyError: Expected 1 argument, received 0.";

    if (typeof noteID === 'string')
       noteID = Waves.convertNoteStringToNumber(noteID);

    var a = Math.pow(2, 1 / 12);
    return 16.35 * Math.pow(a, noteID);
};

/* Waves.convertNoteStringToNumber
 *
 * Converts a string of the form "<Note><Octave>" (e.g. "C4")
 * to a number representing the number of notes from C0.
 *
 * @noteString - string
 */
Waves.convertNoteStringToNumber = function(noteString) {
        if (!(/^[A-G]b?[0-9]+$/).test(noteString))
            throw "createChromaticNoteError: Argument passed not recognized.";

        var note = (/^[A-G]b?/).exec(noteString);

        if (note == "Cb" || note == "Fb") 
            throw "createChromaticNoteError: Cb and Fb are represented as B and E";

        var octave = (/[0-9]+$/).exec(noteString);

        return Waves.NOTES[note] + 12*octave;
}