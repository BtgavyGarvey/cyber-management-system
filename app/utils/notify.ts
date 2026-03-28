// utils/notify.ts
export function sendNotification(message: string) {
  if (!("Notification" in window)) {
    alert("This browser does not support notifications.");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(message);
    // playSound();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(message);
        // playSound(); 
      }
    });
  }
}

function playSound() {
  const audio = new Audio("/alert.mp3"); // place alert.mp3 in your public/ folder
  audio.play().catch(err => console.error("Sound play failed:", err));
}
