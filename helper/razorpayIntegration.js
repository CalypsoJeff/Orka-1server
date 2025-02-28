const Razorpay = require('razorpay');
const Competition = require('../models/competitionModel');





const createRazorpayOrder = async (req, res) => {
  try {
    const { competitionId, amount } = req.body; // Passed amount from front-end (competition cost)

    // Create Razorpay order
    const options = {
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `order_rcptid_${new Date().getTime()}`,
    };

    razorpayInstance.orders.create(options, (err, order) => {
      if (err) {
        console.error('Error creating Razorpay order:', err);
        return res.status(500).json({ error: 'Error creating Razorpay order.' });
      }

      return res.status(200).json({
        message: 'Order created successfully.',
        order,
      });
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'An error occurred while creating Razorpay order.' });
  }
};
