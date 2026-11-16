const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://miracle-laundry:miracle-laundry-pw@cluster0.0spegqu.mongodb.net/miraclelaundry?retryWrites=true&w=majority';

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;

  const totalOverdueUnfiltered = await db.collection('orders').countDocuments({
    status: { $nin: ['Delivered', 'Cancelled'] }
  });

  const unpaidOverdue = await db.collection('orders').countDocuments({
    paymentStatus: { $in: ['Pending', 'Partially Paid', 'unpaid'] }
  });

  console.log('Total Active Non-Delivered Orders (Unfiltered):', totalOverdueUnfiltered);
  console.log('Total Unpaid/Partially Paid Orders:', unpaidOverdue);

  process.exit(0);
});
