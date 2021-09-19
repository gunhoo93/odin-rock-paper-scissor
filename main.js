main(RockPaperScissors);
RockPaperScissorsTests(RockPaperScissors);


function main(rockPaperScissorPackage) {
    const { createWeaponRack, makeWeapon, createScoreBoard, rockPaperScissors } = rockPaperScissorPackage();

    const $weapons = Array.from(document.getElementsByClassName("weapon"));
    const $matchResult = document.getElementById("match-result");

    const $playerWeapon = document.getElementById("player-weapon");
    const $opponentWeapon = document.getElementById("opponent-weapon");

    // Scores
    const $victoryCount = document.getElementById("victory-count");
    const $defeatCount = document.getElementById("defeat-count");
    const $drawCount = document.getElementById("draw-count");
    const $luck = document.getElementById("luck");

    const weapons = createWeaponRack([
        makeWeapon(type = "rock", weeknesses = ["paper", "spock"]),
        makeWeapon(type = "paper", weeknesses = ["scissors", "lizard"]),
        makeWeapon(type = "scissors", weeknesses = ["rock", "spock"]),
        makeWeapon(type = "lizard", weeknesses = ["rock", "scissors"]),
        makeWeapon(type = "spock", weekness = ["paper", "lizard"])
    ]);
    const scoreBoard = createScoreBoard();

    function handleWeaponClick(evt) {
        const weaponType = evt.currentTarget.dataset.weapon;
        if (!weaponType) {
            return;
        }

        const playerWeapon = weapons.select(weaponType);
        const result = rockPaperScissors();
        const opponentWeapon = weapons.reverseSelect(playerWeapon, result);
        scoreBoard.record(result);

        $playerWeapon.innerHTML = `<div class="portrait ${playerWeapon}"></div>`;
        $opponentWeapon.innerHTML = `<div class="portrait ${opponentWeapon}"></div>`;
        $matchResult.textContent = `${result.description}!`;

        $victoryCount.textContent = scoreBoard.victories;
        $defeatCount.textContent = scoreBoard.defeats;
        $drawCount.textContent = scoreBoard.draws;
        $luck.textContent = Math.trunc(Math.round(scoreBoard.winRate * 100)) + "%";
    }

    $weapons.forEach($elem => {
        $elem.addEventListener('click', handleWeaponClick);
    });
};

function RockPaperScissors() {
    const VICTORY = Symbol("Victory");
    const DRAW = Symbol("Draw");
    const DEFEAT = Symbol("Defeat");

    function rockPaperScissors() {
        const roll = Math.random();
        switch (true) {
            case roll >= 2 / 3:
                return VICTORY;
            case roll >= 1 / 3:
                return DEFEAT;
            default:
                return DRAW;
        }
    }

    function makeWeapon(type, weeknesses) {
        function challenge(opponent) {
            if (type === opponent.type) {
                return DRAW;
            }
            const isWeak = weeknesses.some((weekness) => opponent.type === weekness);
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
            // Given a weapon and a result, returns a weapon that will give the result
            reverseSelect(chosenWeapon, result) {
                return weapons.find(weapon => chosenWeapon.challenge(weapon) === result);
            }
        };
    }

    function createScoreBoard() {
        const scores = [];

        function count(val) {
            return scores.filter(elem => elem === val).length;
        }

        function record(result) {
            scores.push(result);
        }

        return {
            record,
            get victories() {
                return count(VICTORY);
            },
            get draws() {
                return count(DRAW);
            },
            get defeats() {
                return count(DEFEAT);
            },
            get winRate() {
                return Math.round(this.victories / scores.length * 100) / 100;
            }
        };
    }

    return { createWeaponRack, makeWeapon, createScoreBoard, rockPaperScissors, VICTORY, DEFEAT, DRAW };
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
        const rock = makeWeapon(type = "rock", weeknesses = ["paper"]);
        const paper = makeWeapon(type = "paper", weeknesses = ["scissors"]);
        const scissors = makeWeapon(type = "scissors", weeknesses = ["rock"]);

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
        const rock = makeWeapon(type = "rock", weeknesses = ["paper", "spock"]);
        const paper = makeWeapon(type = "paper", weeknesses = ["scissors", "lizard"]);
        const scissors = makeWeapon(type = "scissors", weeknesses = ["rock", "spock"]);
        const lizard = makeWeapon(type = "lizard", weeknesses = ["rock", "scissors"]);
        const spock = makeWeapon(type = "spock", weekness = ["paper", "lizard"]);

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
        const rock = makeWeapon(type = "rock", weeknesses = ["paper"]);
        const weapons = createWeaponRack([rock]);

        const selectedWeapon = weapons.select("rock");
        if (selectedWeapon !== rock) {
            throw Error(`Selecting rock returned ${selectedWeapon}`);
        }
    }

    function testFindOpponentWeapon() {
        const rock = makeWeapon(type = "rock", weeknesses = ["paper"]);
        const paper = makeWeapon(type = "paper", weeknesses = ["scissors"]);
        const scissors = makeWeapon(type = "scissors", weeknesses = ["rock"]);
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
