import {GameModel, Player} from "./gameServer.js";
import * as cm from "./cardManager.js";
import {test, expect} from "./testFramework.js";
import {
	isPony,
	isShip,
	isGoal,
	Card, Location
} from "./lib.js";

interface MockPlayer extends Player
{
	grab(...cards: Card[]): void;
	drawGoal(goalCard: Card): void;
	move(card: Card, start: Location, end: Location): void;
	setEffect(card: Card, prop: string, value: string): void;
	endTurn(): void;
}

function expectGoalUnachieved(game: GameModel, goal: Card)
{
	let i = game.currentGoals.map(x => x.card).indexOf(goal);
	expect(i >= 0 && i <= 3).toBe(true);
	expect(game.currentGoals[i].achieved).toBe(false);
}

function expectGoalAchieved(game: GameModel, goal: Card)
{
	let i = game.currentGoals.map(x => x.card).indexOf(goal);
	expect(i >= 0 && i <= 3).toBe(true);
	expect(game.currentGoals[i].achieved).toBe(true);
}


function setupGame():[GameModel, MockPlayer]
{	
	let game = new GameModel();

	cm.init(["*"], {});

	let fakeSocket = {
		isAlive: true,
		send:() => {}
	} as any;
	let sendMessage = game.onMessage(game, fakeSocket);

	let fakePlayer = {
		name: "Test",
		socket: fakeSocket,
		hand: [],
		winnings: [],
		id: 42, 
		grab: function(...cards: Card[])
		{
			for(let card of cards)
			{
				if(isShip(card))
				{
					let i = game.shipDrawPile.indexOf(card);
					if (i == -1) return;
					game.shipDrawPile.splice(i,1);
					fakePlayer.hand.push(card);
					game.cardLocations[card] = "player," + fakePlayer.name;
				}
				if(isPony(card))
				{
					let i = game.ponyDrawPile.indexOf(card);
					if (i == -1) return;
					game.ponyDrawPile.splice(i,1);
					fakePlayer.hand.push(card);
					game.cardLocations[card] = "player," + fakePlayer.name;
				}
			}
			
		},
		drawGoal: function(goalCard: Card)
		{
			let i = game.goalDrawPile.indexOf(goalCard);
			game.goalDrawPile.splice(i, 1);
			game.currentGoals[0] = {card: goalCard, achieved: false};
			game.cardLocations[goalCard] = "goal,1";
		},
		move: function(card: Card, start: Location, end: Location)
		{
			sendMessage("move;" + card + ";" + start + ";" + end);
		},
		setEffect: function(card: Card, prop: string, value: string)
		{
			sendMessage("effects;" + card + ";" + prop + ";" + value);
		},
		endTurn: function()
		{
			sendMessage("endturn");
		}
	} as MockPlayer;

	game.players.push(fakePlayer);
	game.startGame({
		cardDecks: ["Core.*"],
		ruleset: "turnsOnly"
	});

	return [game, fakePlayer];
}

function hasShipPair(ships: [string, string][], pony1: string, pony2: string)
{
	for(let i =0; i<ships.length; i++)
	{
		if ((ships[i][0] == pony1 && ships[i][1] == pony2)
			|| (ships[i][0] == pony2 && ships[i][1] == pony1))
		{
			return true;
		}
	}

	return false;
}



export default function(){

	test("ShippedWithOppositeGenderedSelf", () => {

		let [game, player] = setupGame();

		let goal = "Core.Goal.BuddingCuriosity";
		let ship = "Core.Ship.DudeLooksLikeALady";
		let twi2 = "Core.Pony.SuperSpyTwilight";

		player.drawGoal(goal);
		expectGoalUnachieved(game, goal);

		player.grab(ship);
		player.grab(twi2);

		player.move(ship, "hand", "sr,0,0");
		player.move(twi2, "hand", "p,1,0");

		player.setEffect(twi2, "gender", "male");

		expectGoalAchieved(game, goal);
	});

	test("PlayPonies", ()=>{

		let [game, player] = setupGame();
		let goal = "Core.Goal.ChancellorPuddingheadsEntourage";

		let ships = ["Core.Ship.BadPonyGoToMyRoom", "Core.Ship.BoredOnASundayAfternoon","Core.Ship.CheckingItOffMyList"];
		let ponies = ["Core.Pony.BigMacintosh","Core.Pony.BonBon","Core.Pony.Braeburn"];

		player.drawGoal(goal);
		ships.forEach(x => player.grab(x));
		ponies.forEach(x => player.grab(x));

		player.move(ships[0], "hand", "sr,0,0");
		player.move(ponies[0], "hand", "p,1,0");

		player.move(ships[1], "hand", "sb,1,0");
		player.move(ponies[1], "hand", "p,1,1");

		expectGoalUnachieved(game, goal);

		player.move(ships[2], "hand", "sr,0,1");
		player.move(ponies[2], "hand", "p,0,1");

		expectGoalAchieved(game, goal);

	});


	test("changeling disguise on play doesn't count as a breakup", () =>{

		let [game, player] = setupGame();
		let changeling = "Core.Pony.UnicornChangeling";
		let ship = "Core.Ship.BadPonyGoToMyRoom";
		player.grab(changeling);
		player.grab(ship);


		player.move(ship, "hand", "sr,0,0");
		player.move(changeling, "hand", "p,1,0");

		player.setEffect(changeling, "disguise", "Core.Pony.RoyalGuardShiningArmor");

		expect(game.turnstate!.brokenShipsNow.length).toBe(0);

	});

	test("changeling redisguising breaks up existing ships", () =>{

		let [game, player] = setupGame();
		let ship1 = "Core.Ship.BadPonyGoToMyRoom"
		let ship2 = "Core.Ship.BoredOnASundayAfternoon"
		let ship3 = "Core.Ship.CheckingItOffMyList";
		let ship4 = "Core.Ship.CabinInTheWoodsAwooo";

		let p1 = "Core.Pony.BigMacintosh";
		let p2 = "Core.Pony.BonBon";
		let changeling = "Core.Pony.UnicornChangeling";
		
		[ship1, ship2, ship3, ship4, p1, p2, changeling].forEach(x => player.grab(x));

		player.move(ship1, "hand", "sr,0,0");
		player.move(changeling, "hand", "p,1,0");
		player.setEffect(changeling, "disguise", "Core.Pony.RoyalGuardShiningArmor");

		player.move(ship2, "hand", "sd,0,0");
		player.move(p1, "hand", "p,0,1");

		player.move(ship3, "hand", "sr,0,1");
		player.move(p2, "hand", "p,1,1");

		expect(game.turnstate!.brokenShipsNow.length).toBe(0);

		player.move(ship4, "hand", "sd,1,0");
		player.setEffect(changeling, "disguise", "Core.Pony.StarswirlTheBearded");

		expect(game.turnstate!.brokenShipsNow.length).toBe(2);
		expect(hasShipPair(game.turnstate!.brokenShipsNow, "Core.Start.FanficAuthorTwilight", changeling + ":1")).toBe(true);
		expect(hasShipPair(game.turnstate!.brokenShipsNow, p2, changeling + ":1")).toBe(true);

	});

	test("break ship by love poison changeling to the same card", () =>{

		let [game, player] = setupGame();
		let ship1 = "Core.Ship.BadPonyGoToMyRoom";
		let ship2 = "Core.Ship.BoredOnASundayAfternoon"
		let lovePoison = "Core.Ship.LovePoisonIsNoJoke";

		let pony = "Core.Pony.DramaticallyWoundedRarity";
		let changeling = "Core.Pony.UnicornChangeling";
		
		[ship1, ship2, lovePoison, pony, changeling].forEach(x => player.grab(x));

		player.move(ship1, "hand", "sr,0,0");
		player.move(pony, "hand", "p,1,0");

		player.move(ship2, "hand", "sr,1,0");
		player.move(changeling, "hand", "p,2,0");
		player.setEffect(changeling, "disguise", "Core.Pony.RoyalGuardShiningArmor");

		player.move(lovePoison, "hand", "sd,1,0");
		player.move(changeling, "p,2,0", "p,1,1");
		player.setEffect(changeling, "disguise", "Core.Pony.StarswirlTheBearded");

		expect(game.turnstate?.brokenShipsNow.length).toBe(1);

		let ship = new Set(game.turnstate?.brokenShipsNow[0]);
		expect(ship.has(changeling + ":1")).toBe(true)
		expect(ship.has(pony)).toBe(true);

		expect(game.turnstate?.playedShips.length).toBe(3);
	});

	test("BreakShip: It's not evil w/ changeling", () =>{

		let [game, player] = setupGame();
		let goal = "Core.Goal.ItsNotEvil";

		let ship1 = "Core.Ship.BadPonyGoToMyRoom";
		let ship2 = "Core.Ship.BoredOnASundayAfternoon"
		let lovePoison = "Core.Ship.LovePoisonIsNoJoke";

		let pony = "Core.Pony.DramaticallyWoundedRarity";
		let changeling = "Core.Pony.UnicornChangeling";
		

		player.drawGoal(goal);
		player.grab(ship1, ship2, lovePoison, pony, changeling);

		player.move(ship1, "hand", "sr,0,0");
		player.move(pony, "hand", "p,1,0");

		player.move(ship2, "hand", "sr,1,0");
		player.move(changeling, "hand", "p,2,0");
		player.setEffect(changeling, "disguise", "Core.Pony.RoyalGuardShiningArmor");

		player.move(lovePoison, "hand", "sd,1,0");
		player.move(changeling, "p,2,0", "p,1,1");
		player.setEffect(changeling, "disguise", "Core.Pony.StarswirlTheBearded");

		expectGoalAchieved(game, goal);
	});


	test("Changling moved onto board with replace ability only breaks ships once", ()=>{

		let [game, player] = setupGame();
		let ship1 = "Core.Ship.BadPonyGoToMyRoom";
		let ship2 = "Core.Ship.BoredOnASundayAfternoon";
		let pony1 = "Core.Pony.DramaticallyWoundedRarity";
		let pony2 = "Core.Pony.StarswirlTheBearded";
		let changeling = "Core.Pony.UnicornChangeling";

		player.grab(ship1, ship2, pony1, pony2, changeling);

		player.move(ship1, "hand", "sr,0,0");
		player.move(pony1, "hand", "p,1,0");
		player.move(ship2, "hand", "sr,1,0");
		player.move(pony2, "hand", "p,2,0");

		player.move(pony1, "p,1,0", "offset,1,0");
		player.move(changeling, "hand", "p,1,0");

		expect(game.turnstate!.brokenShipsNow.length).toBe(2);

		player.setEffect(changeling, "disguise", "Core.Pony.VinylScratch");

		expect(game.turnstate!.brokenShipsNow.length).toBe(2);
	});

	test("genderSwapped + CharityAuction", () => {

		let [game, player] = setupGame();
		let goal = "Core.Goal.CharityAuction";
		player.drawGoal(goal);

		let ship1 = "Core.Ship.CanITellYouASecret";
		let ship2 = "Core.Ship.DudeLooksLikeALady";
		let pony1 = "Core.Pony.DramaticallyWoundedRarity";
		let pony2 = "Core.Pony.StarswirlTheBearded";

		player.grab(ship1, ship2, pony1, pony2);

		player.move(ship1, "hand", "sr,0,0");
		player.move(pony1, "hand", "p,1,0");

		player.setEffect(pony1, "gender", "male");

		player.move(ship2, "hand", "sd,1,0");
		player.move(pony2, "hand", "p,1,1");
		player.setEffect(pony2, "gender", "female");

		expectGoalAchieved(game, goal);
	});

	test("PlayLovePoisons", () => {

		let [game, player] = setupGame();
		let goal = "Core.Goal.Epidemic";
		player.drawGoal(goal);

		let pony = "Core.Pony.DramaticallyWoundedRarity";
		let lovePoison1 = "Core.Ship.LovePoisonIsNoJoke";
		let lovePoison2 = "Core.Ship.ShmoopyBoo";

		player.grab(pony, lovePoison1, lovePoison2);

		player.move(lovePoison1, "hand", "sr,0,0");
		player.move(pony, "hand", "p,1,0");

		expectGoalUnachieved(game, goal);

		player.move(lovePoison2, "hand", "sd,0,0");
		player.move(pony, "p,1,0", "p,0,1");


		expectGoalAchieved(game, goal);
	});

	test("PlayPonies takes into account card.count property", () =>{

		let [game, player] = setupGame();
		let goal = "Core.Goal.QueenPlatinumsCourt";
		player.drawGoal(goal);

		let ship1 = "Core.Ship.CanITellYouASecret";
		let ship2 = "Core.Ship.DudeLooksLikeALady";
		let flimFlam = "Core.Pony.Flim&Flam";
		let unicorn = "Core.Pony.HeartlessDictatorRarity";
		player.grab(ship1, ship2, flimFlam, unicorn);

		player.move(ship1, "hand", "sr,0,0");
		player.move(unicorn, "hand", "p,1,0");

		expectGoalUnachieved(game, goal);

		player.move(ship1, "hand", "sr,1,0");
		player.move(flimFlam, "hand", "p,2,0");

		expectGoalAchieved(game, goal);
	});

	test("ExistsChain", () =>{
		//expect(0).toBe("unimplemented");
	});

	test("PlayShips", () =>{
		//expect(0).toBe("unimplemented");
	});

	// accidental play doesn't count as two plays

	// how many ships are broken when you swap cards

	// double ships

	// swap counts

	// Allof EC.Goal.Swinging

	// Recolor



};