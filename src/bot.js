const User = require("../src/user.order");

class Chatbot {
  constructor(io) {
    this.io = io;
    this.menu = [
      { name: " Afang soup", price: 2500 },
      { name: "White soup", price: 2500 },
      { name: " Edikan Ikong soup", price: 2500 },
      { name: " Okro soup", price: 1500 },
      { name: "Obogono soup", price: 1500 },
      { name: "Banga soup", price: 2000 },
      { name: "Oha soup", price: 2500 },
      { name: "Ewedu", price: 2000 },
      { name: "Eba", price: 400 },
      { name: "Fufu", price: 400 },
      { name: "Semolina", price: 400 },
      { name: "Amala", price: 400 },
      { name: "Ajoke's rice", price: 2500 },
      { name: "Asia fried rice ", price: 3000 },
      { name: "Fried turkey", price: 4000 },
      { name: "Fried Chicken", price: 3000 },
      { name: "Fried beef", price: 1000 },
      { name: "Fried fish", price: 2000 },
      { name: "Coleslaw", price: 800 },
      { name: "Water", price: 300 },
    ];
    this.initialMessage = `<b>Select an option:</b><br/>
    1. Place an order<br/>
    99. Checkout order<br/>
    98. See order history<br/>
    97. See current order<br/>
    0. Cancel order`;
  }

  sendMessage(user, message) {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    this.io.to(user.sessionId).emit("message", { message, timestamp });
  }

  generateMenuList() {
    return this.menu
      .map((item, index) => `${index + 10}. ${item.name} - ${item.price}<br/>`)
      .join("");
  }

  handleUserInput(session, input) {
    const userKey = User.generateKey(
      session.user.username,
      session.user.sessionId
    );
    let user = session.users[userKey];

    if (!user) {
      user = new User(session.user.username, session.user.sessionId);
      session.users[userKey] = user;
    } else {
      user = User.getUser(user); // Ensure the user is an instance of User class
    }

    switch (user.currentState) {
      case "initial":
        this.handleInitialInput(user, input);
        break;
      case "ordering":
        this.handleOrderingInput(user, input);
        break;
      default:
        this.sendMessage(user, "An error has occurred");
        user.currentState = "initial";
        break;
    }

    // Sync and update the user and session objects
    session.users[userKey] = user.saveUser();
    session.save();
  }

  handleInitialInput(user, input) {
    switch (input) {
      case "1":
        const menuList = this.generateMenuList();
        this.sendMessage(user, `<b>Menu</b><br/>${menuList}`);
        user.currentState = "ordering";
        break;

      case "99":
        if (user.checkoutOrder()) {
          this.sendMessage(user, "Order placed successfully.");
        } else {
          this.sendMessage(user, "No order to place.");
        }
        break;

      case "98":
        this.sendMessage(
          user,
          `<b>Order history</b><br/>${user.getOrderHistory()}`
        );
        break;

      case "97":
        this.sendMessage(
          user,
          `<b>Current order</b><br/>${user.getCurrentOrder()}`
        );
        break;

      case "0":
        if (user.cancelOrder()) {
          this.sendMessage(user, "Order canceled.");
        } else {
          this.sendMessage(user, "No order to cancel.");
        }
        break;

      default:
        this.sendMessage(user, "Invalid option selected");
        this.sendMessage(user, `${this.initialMessage}`);
        break;
    }
  }

  handleOrderingInput(user, input) {
    const menuIndex = Number(input) - 21;
    if (menuIndex >= 0 && menuIndex < this.menu.length) {
      user.addOrder(this.menu[menuIndex]);
      this.sendMessage(
        user,
        `${this.menu[menuIndex].name} added to your order.`
      );
      this.sendMessage(
        user,
        "Select <br/> 99 to checkout the order <br/>&nbsp;0 to cancel the order <br/> 00 to go to the main menu"
      );
    } else if (input === "99") {
      if (user.checkoutOrder()) {
        this.sendMessage(user, "Order placed successfully.");
      } else {
        this.sendMessage(user, "No order to place.");
      }
    } else if (input === "0") {
      if (user.cancelOrder()) {
        this.sendMessage(user, "Order canceled.");
      } else {
        this.sendMessage(user, "No order to cancel.");
      }
    } else if (input === "00") {
      user.currentState = "initial";
      this.sendMessage(user, `${this.initialMessage}`);
    } else {
      this.sendMessage(
        user,
        "Kindly select a valid option.<br/>Select 00 to go to the main menu"
      );
    }
  }
}

module.exports = Chatbot;
