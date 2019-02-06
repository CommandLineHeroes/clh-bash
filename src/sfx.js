const sfx = {
    cmdGood: new Howl({ src: ["assets/sfx/cmd-good.mp3"] }),
    cmdGold: new Howl({ src: ["assets/sfx/cmd-gold.mp3"] }),
    cmdBad: new Howl({ src: ["assets/sfx/cmd-bad.mp3"] }),
    keypress: new Howl({ src: ["assets/sfx/keypress.mp3"] }),
    timerRelaxed: new Howl({ src: ["assets/sfx/timer-relaxed.mp3"] }),
    timerUrgent: new Howl({ src: ["assets/sfx/timer-urgent.mp3"] }),
    boot: new Howl({ src: ["assets/sfx/boot.mp3"] }),
    menuMusic: new Howl({ src: ["assets/sfx/menu-music.mp3"] }),
    play: new Howl({ src: ["assets/sfx/play.mp3"] })
};

// when these sfx have finished fading out, stop playing and seek back to the beginning
[sfx.boot, sfx.menuMusic, sfx.play].forEach(sound => {
    sound.on("fade", () => {
        sound.stop();
        sound.seek(0);
    });
});

export default sfx;
