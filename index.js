import Web3 from "web3";
import contractABI from "./abi.json";

//  Your deployed contract address
const contractAddress = "0xccDaDF118e8bC1B8f96C463a7676c8a4c236Ac28";

let web3;
let contract;

// Initialize web3 and contract
if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  contract = new web3.eth.Contract(contractABI, contractAddress);
} else {
  console.error("No web3 provider detected");
}

//   Connect Wallet
async function connectWallet() {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setConnected(accounts[0]);
    } catch (error) {
      console.error("User rejected request or error:", error);
    }
  } else {
    console.error("No web3 provider detected");
    document.getElementById("connectMessage").innerText =
      "No web3 provider detected. Please install MetaMask.";
  }
}

//   Create Tweet
async function createTweet(content) {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods.createTweet(content).send({ from: accounts[0] });
    displayTweets(accounts[0]);
  } catch (error) {
    console.error("User rejected request or error:", error);
  }
}

//   Display Tweets
async function displayTweets(userAddress) {
  const tweetsContainer = document.getElementById("tweetsContainer");
  tweetsContainer.innerHTML = "";

  let tempTweets = [];
  try {
    tempTweets = await contract.methods.getAllTweets(userAddress).call();
  } catch (error) {
    console.error("Error fetching tweets:", error);
  }

  // Sort tweets by timestamp descending
  const tweets = [...tempTweets].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp)
  );

  for (let i = 0; i < tweets.length; i++) {
    const tweet = tweets[i];

    // TWEET ELEMENT
    const tweetElement = document.createElement("div");
    tweetElement.className = "tweet";

    // USER ICON
    const userIcon = document.createElement("img");
    userIcon.className = "user-icon";
    const seed = encodeURIComponent(tweet.author.toLowerCase().trim());
    userIcon.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=<seed>`;
    userIcon.alt = "User Icon";
    userIcon.onerror = () => {
      userIcon.src = "https://via.placeholder.com/40?text=User";
    };
    tweetElement.appendChild(userIcon);

    // TWEET INNER
    const tweetInner = document.createElement("div");
    tweetInner.className = "tweet-inner";
    tweetInner.innerHTML += `
      <div class="author">${shortAddress(tweet.author)}</div>
      <div class="content">${tweet.content}</div>
    `;

    // LIKE BUTTON
    const likeButton = document.createElement("button");
    likeButton.className = "like-button";

    // Convert BigInt/string to safe string
    const likesCount = tweet.likes.toString();

    likeButton.innerHTML = `❤️ <span class="likes-count">${likesCount}</span>`;

    likeButton.setAttribute("data-id", tweet.id);
    likeButton.setAttribute("data-author", tweet.author);

    addLikeButtonListener(likeButton, userAddress, tweet.id, tweet.author);

    tweetInner.appendChild(likeButton);
    tweetElement.appendChild(tweetInner);
    tweetsContainer.appendChild(tweetElement);
  }
}

//   Like Button Listener
function addLikeButtonListener(likeButton, address, id, author) {
  likeButton.addEventListener("click", async (e) => {
    e.preventDefault();

    e.currentTarget.innerHTML = '<div class="spinner"></div>';
    e.currentTarget.disabled = true;

    try {
      await likeTweet(author, id);
      displayTweets(address);
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  });
}

//   Shorten Address
function shortAddress(address, startLength = 6, endLength = 4) {
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

//   Like Tweet (replace with actual contract call)
async function likeTweet(author, id) {
  try {
    const accounts = await web3.eth.getAccounts();
    await contract.methods.likeTweet(author, id).send({ from: accounts[0] });
  } catch (error) {
    console.error("User rejected request or error:", error);
  }
}

//   Set Connected Wallet
function setConnected(address) {
  document.getElementById("userAddress").innerText =
    "Connected: " + shortAddress(address);
  document.getElementById("connectMessage").style.display = "none";
  document.getElementById("tweetForm").style.display = "block";

  displayTweets(address);
}

//   Event Listeners
document
  .getElementById("connectWalletBtn")
  .addEventListener("click", connectWallet);

document.getElementById("tweetForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = document.getElementById("tweetContent").value;
  const tweetSubmitButton = document.getElementById("tweetSubmitBtn");
  tweetSubmitButton.innerHTML = '<div class="spinner"></div>';
  tweetSubmitButton.disabled = true;

  try {
    await createTweet(content);
  } catch (error) {
    console.error("Error sending tweet:", error);
  } finally {
    tweetSubmitButton.innerHTML = "Tweet";
    tweetSubmitButton.disabled = false;
  }
});

