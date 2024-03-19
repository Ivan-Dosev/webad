// walletDetector.js
export const detectAndSendWalletAddress = async (backendUrl, clientId, walletAddress) => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length === 0) {
          console.error('No wallet accounts found.');
          return;
        }
  
        const walletAddress = accounts[0];
        console.log('Detected wallet address:', walletAddress);
  
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clientId, address: walletAddress }),
        });
  
        if (!response.ok) {
          throw new Error('Failed to send wallet address to backend');
        }
  
        console.log('Wallet address sent to backend successfully');
      } catch (error) {
        console.error('Error in detecting or sending wallet address:', error);
      }
    } else {
      console.error('Ethereum object not found; make sure MetaMask is installed.');
    }
  };

// walletDetector.js
export const displayWelcomeMessage = async (backendUrl, clientId, setBannerMessage) => {
  try {
    const response = await fetch(`${backendUrl}/welcome_message?clientId=${clientId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch the welcome message');
    }
    const data = await response.json();
    console.log('Banner message:', data.message); // Log to check the message
    setBannerMessage(data.message);
  } catch (error) {
    console.error('Error fetching the welcome message:', error);
  }
};

  