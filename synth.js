function Synth(params) {

    if (!params)
        params = {};

    if (!params.context)
        throw "SynthException: context field must be defined.";

    this.notes = [];

    /* The defaults of the following
     * four fields will be determined by
     * note.js defaults.
     */
    this.volume = params.volume;
    this.modulationRate = params.modulationRate;
    this.modulationIntensity = params.modulationIntensity;
    this.type = params.type;
    this.decay = params.decay;
    this.attack = params.attack;
    this.context = params.context;
    this.destination = params.destination;

    if (!params.type) {
        this.type = 'sine';
    }

    if (typeof this.volume === 'undefined') {
        this.volume = function() {
            return 0.3;
        };
    }

    /* We won't allow attack or 
     * decay to be 0. 
     */
    if (!params.attack)
        this.attack = 5;

    if (!params.decay)
        this.decay = 5;

    if (!params.destination)
        this.destination = this.context.destination;

    this.onKeyDown;
    this.onKeyUp;

    this.miscKeyCodes = [];
    this.onKeyUpFunctions = [];
    this.onKeyDownFunctions = [];

    this.root;
}

/* Synth.prototype.makeNotes
 *
 * Fills this.notes with <numberOfNotes> 
 * chromatic notes starting at <root>.
 */
Synth.prototype.makeNotes = function(root, numberOfNotes) {
    if (typeof root === 'string')
        this.root = Waves.convertNoteStringToNumber(root);
    else
        this.root = root;

    if (this.notes[0]) {
        for (var i = 0; i < this.notes.length; i++) {
            if (this.notes[i].playing)
                this.notes[i].stopNote();
        }
        this.notes = [];
    }

    for (var i = 0; i < numberOfNotes; i++) {

        var frequency = Waves.modulate({shift: Waves.getChromaticFrequency(this.root + i),
                                        intensity: this.modulationIntensity,
                                        rate: this.modulationRate});
        this.notes.push(new Note({frequency: frequency,
                                  volume: this.volume,
                                  type: this.type,
                                  context: this.context
                                })
                        );
    }
}

/* Synth.prototype.mapToKeys
 * 
 * Creates two event listeners,
 * one for keydown and one for 
 * keyup. Takes any number of
 * int arguments which correspond
 * to keyCodes. The order in which
 * the keyCodes are passed determines
 * which keyCode gets assigned to what
 * note in this.notes (e.g. the first 
 * argument gets assigned to 
 * this.notes[0], the second argument
 * gets assigned to this.notes[1] etc.)
 */
Synth.prototype.mapToKeys = function() {
    var args = arguments;

    if (!this.onKeyUp)
        this.createKeyListeners(args);

}

Synth.prototype.mapKeyToFunction = function(keyCode, keydown, keyup) {
    if (!this.onKeyUp)
        this.createKeyListeners();

    this.miscKeyCodes.push(keyCode);
    this.onKeyDownFunctions.push(keydown);
    this.onKeyUpFunctions.push(keyup)

}

Synth.prototype.createKeyListeners = function(args) {
    this.onKeyDown = function(e) {
        for(var i = 0; i < args.length; i++) {
            if (e.keyCode === args[i])
                this.notes[i].playNote(this.destination);
        }

        for(var i = 0; i < this.miscKeyCodes.length; i++) {
            if (e.keyCode === this.miscKeyCodes[i] && this.onKeyDownFunctions[i])
                this.onKeyDownFunctions[i]();
        }
    }.bind(this);

    this.onKeyUp = function(e) {
        for(var i = 0; i < args.length; i++) {
            if (e.keyCode === args[i])
                this.notes[i].stopNote();
        }

        for(var i = 0; i < this.miscKeyCodes.length; i++) {
            if (e.keyCode === this.miscKeyCodes[i] && this.onKeyUpFunctions[i])
                this.onKeyUpFunctions[i]();
        }
    }.bind(this);

    addEventListener('keyup', this.onKeyUp, false);
    addEventListener('keydown', this.onKeyDown, false);

}

Synth.prototype.refreshType = function() {
    if (!this.type)
        this.type = 'sine';

    for (var i = 0; i < this.notes.length; i++)
        this.notes[i].type = this.type;
}

Synth.prototype.refreshVolume = function() {
    if (typeof this.volume === 'undefined')
        this.volume = 0.5;

    for (var i = 0; i < this.notes.length; i++)
        this.notes[i].volume = this.volume;
}

Synth.prototype.refreshFrequency = function() {
    for (var i = 0; i < this.notes.length; i++) {
        var frequency = Waves.modulate({shift: Waves.getChromaticFrequency(this.root + i),
                                        intensity: this.modulationIntensity,
                                        rate: this.modulationRate});
        this.notes[i].frequency = frequency;
    }
}

Synth.prototype.refreshDecay = function() {
    for (var i = 0; i < this.notes.length; i++)
        this.notes[i].decay = this.decay;
}