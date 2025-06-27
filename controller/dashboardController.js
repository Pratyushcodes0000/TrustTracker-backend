const Shipment = require('../models/Shipment');

exports.getDashboardStats = async (req, res) => {
  try {
    const sellerGoogleId = req.user?.sellerGoogleId;

    if (!sellerGoogleId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const totalShipments = await Shipment.countDocuments({ sellerGoogleId: sellerGoogleId });

    const deliveredShipments = await Shipment.countDocuments({
      sellerGoogleId: sellerGoogleId,
      currentStatus: 'Delivered'
    });

    const inTransitStatuses = ['Shipped', 'Out for Delivery', 'In Transit'];
    const inTransitShipments = await Shipment.countDocuments({
      sellerGoogleId: sellerGoogleId,
      currentStatus: { $in: inTransitStatuses }
    });

    const ordersPerWeek = await Shipment.aggregate([
      { $match: { sellerGoogleId: sellerGoogleId } },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$createdAt",
              unit: "week"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          week: "$_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { week: 1 } },
      { $limit: 6 }
    ]);

    const deliveryPerformance = await Shipment.aggregate([
      {
        $match: {
          sellerGoogleId: sellerGoogleId,
          deliveryDate: { $exists: true }
        }
      },
      {
        $project: {
          deliveryTime: {
            $divide: [
              { $subtract: ["$deliveryDate", "$createdAt"] },
              1000 * 60 * 60 * 24
            ]
          },
          week: {
            $dateTrunc: { date: "$deliveryDate", unit: "week" }
          }
        }
      },
      {
        $group: {
          _id: "$week",
          avgDeliveryDays: { $avg: "$deliveryTime" }
        }
      },
      {
        $project: {
          week: "$_id",
          avgDeliveryDays: { $round: ["$avgDeliveryDays", 2] },
          _id: 0
        }
      },
      { $sort: { week: 1 } },
      { $limit: 6 }
    ]);

    res.status(200).json({
      totalShipments,
      deliveredShipments,
      inTransitShipments,
      ordersPerWeek,
      deliveryPerformance
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
