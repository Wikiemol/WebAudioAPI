/* Params fields:
 * 
 * @context - an AudioContext
 * @type - a string representing
 * type of wave to use. See
 * documentation for OscillatorNode
 * for enum.
 * @frequency - a function or a double
 * @volume - a function or a double
 * @attack - a float
 * @decay - a float
 */
function Note(params) {

    if (!params)
        params = {};

    /*----Static Vars----*/
        Note.INTERVAL = 33;

    /*----Public vars----*/
        this.type = params.type;
        this.frequency = params.frequency;
        this.volume = params.volume;
        this.context = params.context;

        this.attack = params.decay;
        this.decay = params.decay;

        /* Converting numbers to functions where 
         * necessary.
         */
        if (typeof params.frequency === 'number') {
            this.frequency = function() {
                return params.frequency;
            }
        }

        if (typeof params.volume === 'number') {
            this.volume = function() {
                return params.volume;
            }
        }

        /**Defaults**/
        if (!params.type) {
            this.type = 'sine';
        }


        if (typeof this.volume === 'undefined') {
            this.volume = function() {
                return 0.1;
            };
        }

        /* We won't allow frequency, 
         * attack, or decay to be 0. 
         */
        if (!params.attack)
            this.attack = 5;

        if (!params.decay)
            this.decay = 5;

        if (!params.frequency) {
            this.frequency = function(){
                return 440;
            };
        }

        /**Exception**/
        if (!params.context)
            throw "NoteException: context field must be defined.";

    /*----'Private' vars----*/

        /* The oscillator Node that is currently
         * playing.
         */
        this.playing;

        /* If decay has started but
         * hasn't finished. this is true.
         * Otherwise it is false.
         */
        this.stopping = false;

        /* The oscillator node
         * that was previously
         * playing. 
         */
        this.prevPlaying;

        /* The interval that is currently
         * set.
         */
        this.interval;

        /* Global gain node */
        this.gain;

        /* The current destination */
        this.destination;

    /*----Public functions----*/

    /* Note.prototype.playNote
     *
     * Creates an oscillator node and starts it. 
     * It also sets an interval so that frequency
     * and volume can be changed with time.
     */
    Note.prototype.playNote = function(dest) {
        if (this.playing && !this.stopping)
            return;

        if(this.stopping)
            this.halt();

        this.destination = dest;
        this.playing = this.context.createOscillator();

        if (!this.gain) {
            this.gain = this.context.createGain();
            this.gain.gain.value = 0;
        }

        this.playing.type = this.type;
        this.playing.connect(this.gain);
        this.gain.connect(this.destination);

        var initTime = this.context.currentTime;

        this.playing.frequency.value = this.frequency(0);

        if (this.prevPlaying)
            this.prevPlaying.disconnect(this.gain);
        this.playing.start();
        var ramping = true;

        this.interval = setInterval(function() {
            var relativeTime = this.context.currentTime - initTime;

            this.playing.frequency.value = this.frequency(relativeTime);

            var relativeVolume = relativeTime * this.attack;

            var volume = this.volume(relativeTime); 

            /* We do the ramp ourselves to account for
             * dynamically changing volumes (e.g.
             * the volume is a function of time).
             * linearRampToValue does not allow
             * for that. 
             *
             * Doing our own is pretty easy and 
             * shouldn't cause much overhead
             * if any.
             */

            if (ramping && relativeVolume < volume) {
                this.gain.gain.value = relativeVolume;
            } else {
                ramping = false;
                this.gain.gain.value = volume;
            }

        }.bind(this), Note.INTERVAL);
    }

    /* Note.prototype.stopNote
     * 
     * Starts to decay the gain.
     * When the gain goes below
     * 0, the note is halted.
     * (See this.halt)
     */
    Note.prototype.stopNote = function() {
        if (!this.playing)
            return;

        this.stopping = true;

        clearInterval(this.interval);

        var ramping = true;
        var initTime = this.context.currentTime;
        var initVolume = this.gain.gain.value;
        this.interval = setInterval(function() {
            var relativeTime = this.context.currentTime - initTime;
            var relativeVolume = -relativeTime * this.decay + initVolume; 

            if (relativeVolume > 0)
                this.gain.gain.value = relativeVolume;
            else
                this.halt();

        }.bind(this), Note.INTERVAL);
    }

    /* Note.prototype.halt
     * 
     * Stops the note immediately
     * without any decay.
     */
    Note.prototype.halt = function() {
        this.gain.gain.value = 0;
        this.prevPlaying = this.playing;

        this.playing = undefined;
        this.stopping = false;

        clearInterval(this.interval);
    }
}