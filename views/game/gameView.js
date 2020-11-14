var HEAD = `
	<link href="/game/game.css" type="text/css" rel="stylesheet" />
	<title>In Game</title>
	<meta property="og:title" content="Game in Progress">
	<meta property="og:description" content="Play and host TSSSF games through the magic of the internet">
	<meta property="og:image" content="http://tsssf.net/img/tsssf-box.png">
`

var HTML = `
<div>
	<div id='sidebar'>
		<div id='ponyDrawPile' class='card pony'></div>
		<div class='shuffleContainer'>
			<img id='ponyShuffle' class='shuffle' src="/img/shuffle.svg"/>
		</div>
		<div id='ponyDiscardPile' class='card discard'></div>
		<div id="shipDrawPile" class='card ship'></div>
		<div class='shuffleContainer'>
			<img id='shipShuffle' class='shuffle' src="/img/shuffle.svg"/>
		</div>
		<div id="shipDiscardPile" class='card discard'></div>
		<div id="goalDrawPile" class='card goal'></div>
		<div class='shuffleContainer'>
			<img id='goalShuffle' class='shuffle' src="/img/shuffle.svg"/>
		</div>
		<div id="goalDiscardPile" class='card discard'></div>
		<div id='turnInfo'></div>
	</div>
	<div id='playingArea'>
		<div id='topToolbar'>
			<div id='playerList'></div>
			<div id='actionButtons'>
				<img  onclick="moveToStartCard()" src="/img/home.svg"/>
				<img id='helpButton' onclick="createHelpPopup()" src="/img/help.svg"/>
			</div>
		</div>
		<div id='winnings'></div>
	</div>
</div>
<div id='cardRow'>
	<div id='currentGoals'>
		<div class='card goal'></div>
		<div class='card goal'></div>
		<div class='card goal'></div>
	</div>
	<div class='divider'></div>
	<div id='hand'>
		<div id='hand-pony'>
			<div class='card pony'></div>
			<div class='card pony'></div>
			<div class='card pony'></div>
			<div class='card pony'></div>
		</div>
		<div id='hand-ship'>
		
			<div class='card ship'></div>
			<div class='card ship'></div>
			<div class='card ship'></div>
		</div>
	</div>
</div>
<div id='preloadedImages' style="display: none;"></div>

<script type="module" src="/game/game.js"></script>
<script type="module" src="/game/network.js"></script>
`
export { HTML, HEAD }