// Include this after your page content loads

document.addEventListener("DOMContentLoaded", async () => {
    const walletButton = document.querySelector("button"); // Assuming the connect wallet button
    let provider = null;

    // Function to detect the wallet provider
    const getProvider = () => {
        if ("solana" in window) {
            const provider = window.solana;
            if (provider.isPhantom) {
                return provider;
            }
        }
        window.open("https://phantom.app/", "_blank");
    };

    // Initialize the wallet provider
    provider = getProvider();

    if (provider) {
        walletButton.textContent = "Connect Wallet";

        walletButton.addEventListener("click", async () => {
            try {
                const res = await provider.connect();
                console.log('Connected with public key:', res.publicKey.toString());
                document.getElementById("balance").textContent = `Connected: ${res.publicKey.toString()}`;
            } catch (err) {
                console.error('Wallet connection failed:', err);
            }
        });
    }
});
// Load audio files

var openCaseSound = new Audio('open_case_sound.mp3');
var receiveItemSound = new Audio('receive_item_sound.mp3');

// Prices for items based on rarity
const prices = {
    legendary: 1,
    blue: 0.05,
    purple: 0.1,
    pink: 0.2,
    red: 0.5,
    yellow: 0.75
};

// Cost to open a case
const CASE_COST = 0.1;

// Item rarities
const imageRarities = ['strawberry', 'cherry', 'apple', 'lemon', 'kiwi', 'pear'];

// Mapping for the items with rarities and prices
const itemDetails = {
    strawberry: { rarity: 'blue', price: prices.blue },
    cherry: { rarity: 'purple', price: prices.purple },
    apple: { rarity: 'pink', price: prices.pink },
    lemon: { rarity: 'red', price: prices.red },
    kiwi: { rarity: 'yellow', price: prices.yellow },
    pear: { rarity: 'legendary', price: prices.legendary }
};

const IMAGE_WIDTH = 128;
const IMAGE_HEIGHT = 128;
const IMAGE_COUNT = 7; // Changed to show 7 items
const OFFSET = 1;
const BASE_SPEED = 2; // Slower base speed
const ACCELERATION_DURATION_MIN = 2000; // Longer acceleration duration
const ACCELERATION_DURATION_MAX = 3000; // Longer acceleration duration
const ACCELERATION_STEP = 0.5; // Smaller acceleration step
const DECELERATION_MULTIPLIER = 0.98; // Slower deceleration
const RETURN_MULTIPLIER = 0.05; // Slower return to center
const STATE = {
    ACCELERATION: 1,
    DECELERATION: 2,
    RETURN: 3
};

const images = [];
const imageUrls = [
    'https://img-cdn.magiceden.dev/rs:fill:640:0:0/plain/https://nftstorage.link/ipfs/bafybeiddkm54ndfhjcdczxvtvlwgx4akjttrt6enon3jok45jxhfkkubom/1757.jpeg',
    'https://img-cdn.magiceden.dev/rs:fill:640:0:0/plain/https%3A%2F%2Farweave.net%2Fncly6YfuPtJ8ZErOMyWL6WQTtkjjhQmFWCD44nR4M-I%3Fext%3Dpng',
    'https://pbs.twimg.com/media/FKLJn6vaMAAAfQ4.png',
    'https://img-cdn.magiceden.dev/rs:fill:640:0:0/plain/https://we-assets.pinit.io/J2Q2j6kpSg7tq8JzueCHNTQNcyNnQkvr85RhsFnYZWeG/f7ac2fd2-13c4-4ca1-85ee-962772caf73e/3912',
    'https://img-cdn.magiceden.dev/rs:fill:640:0:0/plain/https://metadata.degods.com/g/5720-dead-rm.png',
];

let speed = 0;
let state = STATE.RETURN;
let startIndex = 0;
let startTime = 0;
let accelerationDuration = 0;
let offset = 0;
let balance = 10; // Example balance in SOL, update this as needed

const canvas = document.getElementById('slotMachineCanvas');
const context = canvas.getContext('2d');

const img = {
    blue: '<img src="https://img-cdn.magiceden.dev/rs:fill:640:0:0/plain/https://nftstorage.link/ipfs/bafybeiddkm54ndfhjcdczxvtvlwgx4akjttrt6enon3jok45jxhfkkubom/1757.jpeg"/>',
    purple: '<img src="https://img-cdn.magiceden.dev/rs:fill:640:0:0/plain/https%3A%2F%2Farweave.net%2Fncly6YfuPtJ8ZErOMyWL6WQTtkjjhQmFWCD44nR4M-I%3Fext%3Dpng"/>',
    pink: '<img src="https://pbs.twimg.com/media/FKLJn6vaMAAAfQ4.png"/>',
    red: '<img src="https://img-cdn.magiceden.dev/rs:fill:640:0:0/plain/https://we-assets.pinit.io/J2Q2j6kpSg7tq8JzueCHNTQNcyNnQkvr85RhsFnYZWeG/f7ac2fd2-13c4-4ca1-85ee-962772caf73e/3912"/>',
    yellow: '<img src="https://img-cdn.magiceden.dev/rs:fill:640:0:0/plain/https://metadata.degods.com/g/5720-dead-rm.png"/>'
};

let inventory = [];

const loadImage = (url) => fetch(url)
    .then(response => response.blob())
    .then(createImageBitmap)
    .catch(error => console.error('Error loading image:', error));

const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const drawSlotMachine = () => {
    const imagesLength = images.length;
    const center = Math.floor(canvas.width / 2);

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let index = -OFFSET; index < IMAGE_COUNT + OFFSET; index++) {
        const imageIndex = index < 0 ? index + imagesLength : index;
        const image = images[(imageIndex + startIndex) % imagesLength];
        context.drawImage(
            image,
            IMAGE_WIDTH * index - offset,
            0,
            IMAGE_WIDTH,
            IMAGE_HEIGHT
        );
    }

    context.moveTo(center + 0.5, 0);
    context.lineTo(center + 0.5, canvas.height);
    context.closePath();
    context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    context.stroke();
};

const updateSlotMachine = () => {
    const imagesLength = images.length;
    const deltaTime = performance.now() - startTime;

    if (deltaTime > accelerationDuration && state === STATE.ACCELERATION) {
        state = STATE.DECELERATION;
    }

    if (offset > IMAGE_WIDTH) {
        startIndex = (startIndex + 1) % imagesLength;
        offset %= IMAGE_WIDTH;
    }

    drawSlotMachine();

    const center = IMAGE_WIDTH * (IMAGE_COUNT / 2);
    const index = Math.floor((center + offset) / IMAGE_WIDTH);

    offset += speed;
    if (state === STATE.ACCELERATION) {
        speed += ACCELERATION_STEP;
    } else if (state === STATE.DECELERATION) {
        speed *= DECELERATION_MULTIPLIER;
        if (speed < 1e-2) {
            speed = 0;
            state = STATE.RETURN;
        }
    } else if (state === STATE.RETURN) {
        const halfCount = Math.floor(IMAGE_COUNT / 2);
        const distance = IMAGE_WIDTH * (index - halfCount) - offset;
        const step = distance * RETURN_MULTIPLIER;

        offset += Math.max(0.1, Math.abs(step)) * Math.sign(step);

        if (Math.abs(offset) <= 0.1) {
            offset = 0;
        }
    }

    if (speed > 0 || offset !== 0) {
        requestAnimationFrame(updateSlotMachine);
    } else {
        const winnerIndex = (startIndex + Math.floor(IMAGE_COUNT / 2)) % imagesLength;
        receiveItemSound.play();
        const reward = imageUrls[winnerIndex];
        const rarity = imageRarities[winnerIndex];
        const item = { rarity: rarity, src: reward, price: itemDetails[rarity].price };

        $('#dialog-msg').html("You have received an item!" + "<br><img src=" + reward + ">");
        inventory.push(item);
        displayInventory();
        addToLivePreview(rarity, reward);

        $('#dialog').dialog({
            modal: true,
            title: "New item!",
            resizable: false,
            draggable: false,
            width: 300,
            buttons: {
                "Receive item": function () {
                    $(this).dialog("close");
                    // Enable the button once dialog is closed
                    $('#openCaseButton').prop('disabled', false);
                }
            }
        });
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    const walletButton = document.querySelector("button"); // Assuming the connect wallet button
    let provider = null;

    // Function to detect the wallet provider
    const getProvider = () => {
        if ("solana" in window) {
            const provider = window.solana;
            if (provider.isPhantom) {
                return provider;
            }
        }
        window.open("https://phantom.app/", "_blank");
    };

    // Initialize the wallet provider
    provider = getProvider();

    if (provider) {
        walletButton.textContent = "Connect Wallet";

        walletButton.addEventListener("click", async () => {
            try {
                const res = await provider.connect();
                console.log('Connected with public key:', res.publicKey.toString());
                document.getElementById("balance").textContent = `Connected: ${res.publicKey.toString()}`;
            } catch (err) {
                console.error('Wallet connection failed:', err);
            }
        });
    }
});

const initSlotMachine = async () => {
    [canvas.width, canvas.height] = [IMAGE_WIDTH * IMAGE_COUNT, IMAGE_HEIGHT];

    for (const imageUrl of imageUrls) {
        images.push(await loadImage(imageUrl));
    }

    $('#openCaseButton').on('click', function (e) {
        e.preventDefault(); // Prevent scrolling
        if (balance >= CASE_COST) {
            if (!$(this).prop('disabled')) {
                $(this).prop('disabled', true); // Disable the button
                openCaseSound.play();
                balance -= CASE_COST;
                $('#balance').text(`Balance: ${balance.toFixed(2)} SOL`);
                if (speed === 0 && offset === 0) {
                    startTime = performance.now();
                    accelerationDuration = random(ACCELERATION_DURATION_MIN, ACCELERATION_DURATION_MAX);
                    state = STATE.ACCELERATION;
                    speed = BASE_SPEED;

                    requestAnimationFrame(updateSlotMachine);
                }
            }
        } else {
            alert("Not enough balance to open the case!");
        }
    });

    drawSlotMachine();
};

function updateInventory() {
    displayInventory();
}

function displayInventory() {
    const inventoryDiv = $('#inventory-items');
    inventoryDiv.empty();
    inventory.forEach((item, index) => {
        const inventoryItem = $(`
            <div class="inventory-item">
                <img src="${item.src}" alt="${item.rarity}">
                <div class="details">
                    <span>${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} - ${item.price} SOL</span>
                    <button class="sell-button" data-index="${index}">Sell</button>
                    <button class="withdraw-button" data-index="${index}">Withdraw</button>
                </div>
            </div>
        `);
        inventoryDiv.append(inventoryItem);
    });

    $('.sell-button').on('click', function () {
        const itemIndex = $(this).data('index');
        const item = inventory[itemIndex];
        balance += item.price;
        $('#balance').text(`Balance: ${balance.toFixed(2)} SOL`);
        inventory.splice(itemIndex, 1);
        displayInventory();
    });

    $('.withdraw-button').on('click', function () {
        const itemIndex = $(this).data('index');
        alert(`Withdraw functionality for item at index ${itemIndex} is not implemented yet.`);
    });
}

function addToLivePreview(rarity, src) {
    if (rarity && src) {
        var previewArea = $('#preview-area');
        var previewItem = $('<div class="preview-item"></div>');
        previewItem.html('<img src="' + src + '"><span>' + rarity.charAt(0).toUpperCase() + rarity.slice(1) + '</span>');
        previewArea.prepend(previewItem);

        if (previewArea.children().length > 20) {
            previewArea.children().last().remove();
        }
    }
}

// Function to simulate live preview updates
function simulateLivePreview() {
    var rarities = ['blue', 'purple', 'pink', 'red', 'yellow'];
    setInterval(function () {
        var randRarity = rarities[random(0, rarities.length)];
        var src = $(img[randRarity]).attr('src');
        addToLivePreview(randRarity, src);
    }, 1000); // Every second

    // Remove the oldest preview item every 10 seconds
    setInterval(function () {
        var previewArea = $('#preview-area');
        if (previewArea.children().length > 0) {
            previewArea.children().last().remove();
        }
    }, 10000);
}

// Show visual effects for high-value wins
function showWinEffects() {
    const confettiElement = document.createElement('div');
    confettiElement.className = 'confetti';
    document.body.appendChild(confettiElement);
    setTimeout(() => {
        confettiElement.remove();
    }, 5000); // Duration of the effect
}

// Start the live preview simulation when the document is ready
$(document).ready(function () {
    $('#balance').text(`Balance: ${balance.toFixed(2)} SOL`);
    simulateLivePreview();
    initSlotMachine();
});

$(document).ready(function() {
    $(".about").click(function() {
        $(".frontPage").fadeOut(500);
        $(".aboutPage")
          .delay(500)
          .slideDown(500);
    });
    $(".skills").click(function() {
        $(".frontPage").fadeOut(500);
        $(".skillPage")
          .delay(500)
          .fadeIn(700);
    });
    $(".projects").click(function() {
        $(".frontPage").fadeOut(500);
        $(".projectPage")
          .delay(500)
          .fadeIn(700);
    });
    $(".contact").click(function() {
        $(".frontPage").fadeOut(500);
        $(".contactPage")
          .delay(500)
          .fadeIn(700);
    });
    $("#close").click(function() {
        $(".aboutPage").slideUp(500);
        $(".frontPage")
          .delay(500)
          .fadeIn(700);
    });
    $(".close").click(function() {
        $(".skillPage").fadeOut(500);
        $(".frontPage")
          .delay(500)
          .fadeIn(700);
    });
    $(".closer").click(function() {
        $(".projectPage").fadeOut(500);
        $(".frontPage")
          .delay(500)
          .fadeIn(700);
    });
    $(".closing").click(function() {
        $(".contactPage").fadeOut(500);
        $(".frontPage")
          .delay(500) 
          .fadeIn(700);
    });
});
