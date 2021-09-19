RockPaperScissorsTests(RockPaperScissors);
main(RockPaperScissors);

/** Shared functions **/
function pickRandom(array) {
    const pick = Math.floor(Math.random() * array.length);
    return array[pick];
}

/** main function for initializing game **/
function main(rockPaperScissorPackage) {
    const { Game } = rockPaperScissorPackage();

    const $weapons = Array.from(document.getElementsByClassName("weapon"));
    const $matchResult = document.getElementById("match-result");

    const $playerWeapon = document.getElementById("player-weapon");
    const $opponentWeapon = document.getElementById("opponent-weapon");

    const $victoryCount = document.getElementById("victory-count");
    const $defeatCount = document.getElementById("defeat-count");
    const $drawCount = document.getElementById("draw-count");
    const $luck = document.getElementById("luck");

    const weaponConfigs = [
        { type: "rock", weakTo: ["paper", "spock"] },
        { type: "paper", weakTo: ["scissors", "lizard"] },
        { type: "scissors", weakTo: ["rock", "spock"] },
        { type: "lizard", weakTo: ["rock", "scissors"] },
        { type: "spock", weakTo: ["paper", "lizard"] }
    ];

    const gameFactories = [
        () => Game.fairDifficulty(weaponConfigs),
        () => Game.riggedDifficulty(weaponConfigs),
        () => Game.randomDifficulty(weaponConfigs)
    ];

    const game = pickRandom(gameFactories)();

    function handleWeaponClick(evt) {
        const playerWeaponChoice = evt.currentTarget.dataset.weapon;
        if (!playerWeaponChoice) {
            return;
        }

        const match = game.play(playerWeaponChoice);

        $playerWeapon.innerHTML = `<div class="portrait ${match.playerWeapon}"></div>`;
        $opponentWeapon.innerHTML = `<div class="portrait ${match.opponentWeapon}"></div>`;
        $matchResult.textContent = `${match.stats.result}!`;

        $victoryCount.textContent = match.stats.victories;
        $defeatCount.textContent = match.stats.defeats;
        $drawCount.textContent = match.stats.draws;
        $luck.textContent = Math.trunc(Math.round(match.stats.winRate * 100)) + "%";
    }

    $weapons.forEach($elem => {
        $elem.addEventListener('click', handleWeaponClick);
    });
};

/** Provides functionalities for creating Rock, Paper, Scissors game **/
function RockPaperScissors() {
    const VICTORY = Symbol("Victory");
    const DRAW = Symbol("Draw");
    const DEFEAT = Symbol("Defeat");

    function count(arr, val) {
        return arr.filter(elem => elem === val).length;
    }

    function makeWeapon(type, weaknesses) {
        function challenge(opponent) {
            if (type === opponent.type) {
                return DRAW;
            }
            const isWeak = weaknesses.some((weakness) => opponent.type === weakness);
            return isWeak ? DEFEAT : VICTORY;
        }

        return Object.freeze({
            type,
            challenge,
            toString: () => type
        });
    }

    function createWeaponRack(weapons) {
        if (!weapons) {
            throw Error("WeaponRack requires at least one weapon");
        }
        return {
            select(type) {
                const selectedWeapon = weapons.find(weapon => weapon.type === type);
                if (!selectedWeapon) {
                    throw Error(`${type} is unknown weapon`);
                }
                return selectedWeapon;
            },

            /**
             * Picks a weapon that will create the expected result.
             * @param {Weapon} chosenWeapon weapon participated in the match.
             * @param {Symbol} result the expected outcome of match.
             * @returns {Weapon} a weapon
             */
            reverseSelect(chosenWeapon, result) {
                const possibleWeapons = weapons.filter(weapon => chosenWeapon.challenge(weapon) === result);
                return pickRandom(possibleWeapons);
            }
        };
    }

    function createScoreBoard() {
        const match_history = [];

        function _count(val) {
            return count(match_history, val);
        }

        function record(result) {
            match_history.push(result);
        }

        return {
            record,
            get victories() {
                return _count(VICTORY);
            },
            get draws() {
                return _count(DRAW);
            },
            get defeats() {
                return _count(DEFEAT);
            },
            get winRate() {
                return Math.round(this.victories / match_history.length * 100) / 100;
            }
        };
    }

    class GameStrategy {
        constructor(outcomes) {
            this.outcomes = outcomes;
        }

        run() {
            return pickRandom(this.outcomes);
        }

        get winningProbability() {
            return count(this.outcomes, VICTORY) / this.outcomes.length;
        }
    }

    /**
     * Creates a game environment that matches the game's theoratical probability.
     */
    class FairGame extends GameStrategy {
        constructor(weaponCount, weaknessCount) {
            const outcomes = [DRAW];
            for (let i = 0; i < weaknessCount; ++i) {
                outcomes.push(DEFEAT);
            }
            for (let i = 0; i < weaponCount - weaknessCount - 1; ++i) {
                outcomes.push(VICTORY);
            }
            super(outcomes);
        }
    }

    /**
     * Creates a game environment where a player is likely to lose.
     */
    class RiggedGame extends GameStrategy {
        constructor() {
            const outcomes = [];
            for (let i = 0; i < 40; ++i) {
                outcomes.push(pickRandom([VICTORY, DEFEAT, DEFEAT, DRAW, DRAW]));
            }
            super(outcomes);
        }
    }

    class RandomGame extends GameStrategy {
        constructor() {
            const outcomesSize = Math.floor(Math.random() * 40) + 5;
            const outcomes = [];
            for (let i = 0; i < outcomesSize; ++i) {
                outcomes.push(pickRandom([VICTORY, DEFEAT, DRAW]));
            }
            super(outcomes);
        }
    }

    /**
     * Creates Rock, Paper, Scssor like games.
     * @param {{type: string, weakTo: string[]}[]} weaponConfigs defines weapons and their relationship. e.g. [ {type: "rock", weakTo: {"paper"}, ... ]
     * @param {GameStrategy} gameStrategy an object that implements GameStrategy.run() which returns VICTORY, DRAW, or DEFEAT. 
     */
    class Game {
        constructor(weaponConfigs, gameStrategy) {
            this.gameStrategy = gameStrategy;
            this.weapons = createWeaponRack(weaponConfigs.map(({ type, weakTo }) => makeWeapon(type, weakTo)));
            this.scoreBoard = createScoreBoard();
            console.log(`Game initialized as ${gameStrategy.constructor.name} mode with a winning probability of ${gameStrategy.winningProbability}`);
        }

        static fairDifficulty(weaponConfigs) {
            const fairGame = new FairGame(weaponConfigs.length, weaponConfigs[0].weakTo.length);
            return new Game(weaponConfigs, fairGame);
        }

        static riggedDifficulty(weaponConfigs) {
            const riggedGame = new RiggedGame();
            return new Game(weaponConfigs, riggedGame);
        }

        static randomDifficulty(weaponConfigs) {
            const randomGame = new RandomGame();
            return new Game(weaponConfigs, randomGame);
        }

        /**
         * Plays the game given the player choice of weapon.
         * The weapon choice must exists in weapons from weaponConfigs
         * @param {string} playerWeaponChoice type of weapon in string literal
         * @returns {{playerWeapon: string, opponentWeapon: string, stats: {result: string, victories: number, draws: number, defeats: number, winRate: number}}}
         */
        play(playerWeaponChoice) {
            const playerWeapon = this.weapons.select(playerWeaponChoice);
            const result = this.gameStrategy.run();
            const opponentWeapon = this.weapons.reverseSelect(playerWeapon, result);
            this.scoreBoard.record(result);

            return Object.freeze({
                playerWeapon: playerWeapon.toString(),
                opponentWeapon: opponentWeapon.toString(),
                stats: {
                    result: result.description,
                    victories: this.scoreBoard.victories,
                    defeats: this.scoreBoard.defeats,
                    draws: this.scoreBoard.draws,
                    winRate: this.scoreBoard.winRate,
                }
            });
        }
    }

    return { createWeaponRack, makeWeapon, createScoreBoard, VICTORY, DEFEAT, DRAW, Game };
}


function RockPaperScissorsTests(rockPaperScissorPackage) {
    const { createWeaponRack, makeWeapon, createScoreBoard, VICTORY, DEFEAT, DRAW } = rockPaperScissorPackage();

    function runTest(test) {
        try {
            test();
            console.log(`[Ok]${test.name}`);
        } catch (err) {
            console.error(`[Fail]${test.name}`);
            console.error(`\t${err.message}`);
        }
    }

    function testWeaponCanChallengeOtherWeapon() {
        const rock = makeWeapon(type = "rock", weaknesses = ["paper"]);
        const paper = makeWeapon(type = "paper", weaknesses = ["scissors"]);
        const scissors = makeWeapon(type = "scissors", weaknesses = ["rock"]);

        switch (true) {
            case rock.challenge(paper) !== DEFEAT:
                throw Error("Rock should lose against Paper");
            case rock.challenge(scissors) !== VICTORY:
                throw Error("Rock should win against Scissors");
            case rock.challenge(rock) !== DRAW:
                throw Error("Rock should tie against Rock");
        }
    }

    function testAllWeaponVictoryCondition() {
        const rock = makeWeapon(type = "rock", weaknesses = ["paper", "spock"]);
        const paper = makeWeapon(type = "paper", weaknesses = ["scissors", "lizard"]);
        const scissors = makeWeapon(type = "scissors", weaknesses = ["rock", "spock"]);
        const lizard = makeWeapon(type = "lizard", weaknesses = ["rock", "scissors"]);
        const spock = makeWeapon(type = "spock", weakness = ["paper", "lizard"]);

        function testVicotyrCondition(strong, weak, msg) {
            const result = strong.challenge(weak);
            if (result !== VICTORY) {
                throw Error(`Wrong! ${msg}, got ${result.description}`);
            }
        }

        testVicotyrCondition(scissors, paper, "Scissors cuts Paper");
        testVicotyrCondition(paper, rock, "Paper covers Rock");
        testVicotyrCondition(rock, lizard, "Rock crushes Lizard");
        testVicotyrCondition(lizard, spock, "Lizard poisons Spock");
        testVicotyrCondition(spock, scissors, "Spock smashes Scissors");
        testVicotyrCondition(scissors, lizard, "Scissors decapitates Lizard");
        testVicotyrCondition(lizard, paper, "Lizard eats Paper");
        testVicotyrCondition(paper, spock, "Paper disproves Spock");
        testVicotyrCondition(spock, rock, "Spock vaporizes Rock");
        testVicotyrCondition(rock, scissors, "Rock crushes Scissors");
    }

    function testSelectWeaponFromWeaponRack() {
        const rock = makeWeapon(type = "rock", weaknesses = ["paper"]);
        const weapons = createWeaponRack([rock]);

        const selectedWeapon = weapons.select("rock");
        if (selectedWeapon !== rock) {
            throw Error(`Selecting rock returned ${selectedWeapon}`);
        }
    }

    function testFindOpponentWeapon() {
        const rock = makeWeapon(type = "rock", weaknesses = ["paper"]);
        const paper = makeWeapon(type = "paper", weaknesses = ["scissors"]);
        const scissors = makeWeapon(type = "scissors", weaknesses = ["rock"]);
        const weapons = createWeaponRack([rock, paper, scissors]);

        switch (true) {
            case weapons.reverseSelect(rock, VICTORY) !== scissors:
                throw Error(`Expected ${scissors}, got ${weapons.reverseSelect(rock, VICTORY)}`);
            case weapons.reverseSelect(rock, DEFEAT) !== paper:
                throw Error(`Expected ${paper}, got ${weapons.reverseSelect(rock, DEFEAT)}`);
            case weapons.reverseSelect(rock, DRAW) !== rock:
                throw Error(`Expected ${rock}, got ${weapons.reverseSelect(rock, DRAW)}`);
        }
    }

    function testScoreBoard() {
        const scoreBoard = createScoreBoard();

        scoreBoard.record(VICTORY);
        scoreBoard.record(VICTORY);
        scoreBoard.record(DEFEAT);
        scoreBoard.record(DEFEAT);
        scoreBoard.record(DRAW);
        scoreBoard.record(DRAW);

        switch (true) {
            case scoreBoard.victories !== 2:
                throw Error(`Expected victory count of 2, got ${scoreBoard.victories}`);
            case scoreBoard.defeats !== 2:
                throw Error(`Expected defeat count of 2, got ${scoreBoard.defeats}`);
            case scoreBoard.draws !== 2:
                throw Error(`Expected draw count of 2, got ${scoreBoard.draws}`);
            case scoreBoard.winRate !== 0.33:
                throw Error(`Expected win rate of 0.33, got ${scoreBoard.winRate}`);
        }
    }

    runTest(testWeaponCanChallengeOtherWeapon);
    runTest(testAllWeaponVictoryCondition);
    runTest(testSelectWeaponFromWeaponRack);
    runTest(testFindOpponentWeapon);
    runTest(testScoreBoard);
}
