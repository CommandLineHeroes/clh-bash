const sfx = {
    cmdGood: new Howl({ src: ["assets/sfx/cmd-good.mp3"] }),
    cmdGold: new Howl({ src: ["assets/sfx/cmd-gold.mp3"] }),
    cmdBad: new Howl({ src: ["assets/sfx/cmd-bad.mp3"] }),
    keypress: new Howl({ src: ["assets/sfx/keypress.mp3"] }),
    timerRelaxed: new Howl({ src: ["assets/sfx/timer-relaxed.mp3"] }),
    timerUrgent: new Howl({ src: ["assets/sfx/timer-urgent.mp3"] }),
    boot: new Howl({ src: ["assets/sfx/boot.mp3"] }),
    menuMusic: new Howl({ src: ["assets/sfx/menu-music.mp3"], volume: 0.5 }),
    play: new Howl({ src: ["assets/sfx/play.mp3"], volume: 0.6 })
};

// preserve the original volume setting for each sfx
_.forEach(sfx, s => (s.originalVolume = s.volume()));

// when these sfx have finished fading out, stop playing and seek back to the beginning
[sfx.boot, sfx.menuMusic, sfx.play].forEach(sound => {
    sound.on("fade", () => {
        sound.stop();
        sound.seek(0);
        sound.volume(sound.originalVolume);
    });
});

window.sfx = sfx;

export default sfx;
