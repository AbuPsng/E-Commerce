import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import {
  calculatePercentage,
  getChartData,
  getInventories,
} from "../utils/feature.js";

export const getDashBoardStats = TryCatch(async (req, res, next) => {
  let stats;
  const key = "admin - stats";

  if (myCache.has(key)) {
    stats = JSON.parse(myCache.get(key) as string);
  } else {
    let today = new Date();
    const sixMonthAgo = new Date();

    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };

    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const lastSixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    });

    const latestTransactionsPromise = Order.find({})
      .select(["orderItems", "discount", "total", "status"])
      .limit(4);

    const [
      thisMonthProducts,
      thisMonthUsers,
      thisMonthOrders,
      lastMonthProducts,
      lastMonthUsers,
      lastMonthOrders,
      productsCount,
      usersCounts,
      allOrders,
      lastSixMonthOrders,
      categories,
      femaleUsersCount,
      latestTransactions,
    ] = await Promise.all([
      thisMonthProductsPromise,
      thisMonthUsersPromise,
      thisMonthOrdersPromise,
      lastMonthProductsPromise,
      lastMonthUsersPromise,
      lastMonthOrdersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total"),
      lastSixMonthOrdersPromise,
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestTransactionsPromise,
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const changePercent = {
      revenues: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
      products: calculatePercentage(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),
      users: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
      orders: calculatePercentage(
        thisMonthOrders.length,
        lastMonthOrders.length
      ),
    };

    const totalRevenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const counts = {
      products: productsCount,
      users: usersCounts,
      orders: allOrders.length,
      revenues: totalRevenue,
    };

    const orderMonthCounts = getChartData({
      length: 6,
      docArr: lastSixMonthOrders,
      today,
    });
    const orderMonthlyRevenue = getChartData({
      length: 6,
      docArr: lastSixMonthOrders,
      today,
      property: "total",
    });

    const categoryCount = await getInventories({
      categories,
      productsCount,
    });

    const userRatio = {
      male: usersCounts - femaleUsersCount,
      female: femaleUsersCount,
    };

    const modifiedLatestTransactions = latestTransactions.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status,
    }));

    stats = {
      categoryCount,
      changePercent,
      counts,
      chart: {
        order: orderMonthCounts,
        revenue: orderMonthlyRevenue,
      },
      userRatio,
      latestTransactions: modifiedLatestTransactions,
    };

    myCache.set(key, JSON.stringify(stats));
  }

  return res.status(201).json({
    success: true,
    stats,
  });
});

export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = "admin-pie-charts";

  if (myCache.has(key)) {
    charts = JSON.parse(myCache.get(key) as string);
  } else {
    const allOrdersPromise = Order.find({}).select([
      "total",
      "discount",
      "subtotal",
      "tax",
      "shippingCharges",
    ]);

    const [
      processingOrders,
      shippedOrders,
      deliveredOrders,
      categories,
      productsCount,
      productsOutOfStock,
      allOrders,
      allUsers,
      adminUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrdersPromise,
      User.find({}).select("dob"),
      User.countDocuments({ role: "admin" }),
    ]);

    const orderFullfillment = {
      processing: processingOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
    };

    const productCategories = await getInventories({
      categories,
      productsCount,
    });

    const stockAvailability = {
      inStock: productsCount - productsOutOfStock,
      outStock: productsOutOfStock,
    };

    const grossIncome = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const totalDiscount = allOrders.reduce(
      (total, order) => total + (order.discount || 0),
      0
    );

    const productionCost = allOrders.reduce(
      (total, order) => total + (order.shippingCharges || 0),
      0
    );

    const burnt = allOrders.reduce(
      (total, order) => total + (order.tax || 0),
      0
    );

    const marketingCost = Math.round(grossIncome * (30 / 100));

    const netMargin =
      grossIncome - totalDiscount - productionCost - burnt - marketingCost;

    const revenueDistribution = {
      netMargin,
      totalDiscount,
      productionCost,
      burnt,
      marketingCost,
    };

    const usersAgeGroup = {
      teen: allUsers.filter((i) => i.age < 20 && i.age > 0).length,
      adult: allUsers.filter((i) => i.age <= 40 && i.age >= 20).length,
      old: allUsers.filter((i) => i.age >= 40).length,
    };

    const adminCustomer = {
      admin: adminUsers,
      customer: allUsers.length - adminUsers,
    };

    charts = {
      orderFullfillment,
      productCategories,
      stockAvailability,
      revenueDistribution,
      usersAgeGroup,
      adminCustomer,
    };

    myCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getBarCharts = TryCatch(async (req, res, next) => {
  let charts;

  const key = "admin-bar-charts";

  if (myCache.has(key)) {
    charts = JSON.parse(myCache.get(key) as string);
  } else {
    const today = new Date();

    const sixMonthAgo = new Date();
    const twelveMonthAgo = new Date();

    sixMonthAgo.setMonth(today.getMonth() - 6);
    twelveMonthAgo.setMonth(today.getMonth() - 12);

    const lastSixMonthProductsPromise = Product.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    }).select("createdAt");

    const lastSixMonthUserPromise = User.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    }).select("createdAt");

    const lastTwelveMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: twelveMonthAgo,
        $lte: today,
      },
    }).select("createdAt");

    const [products, users, orders] = await Promise.all([
      lastSixMonthProductsPromise,
      lastSixMonthUserPromise,
      lastTwelveMonthOrdersPromise,
    ]);

    const productCounts = getChartData({ length: 6, docArr: products, today });

    const userCounts = getChartData({ length: 6, docArr: users, today });

    const orderCounts = getChartData({ length: 12, docArr: orders, today });

    charts = {
      users: userCounts,
      products: productCounts,
      orders: orderCounts,
    };

    myCache.set(key, JSON.stringify(charts) as string);
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getLineCharts = TryCatch(async (req, res, next) => {
  let charts;

  const key = "admin-line-charts";

  if (myCache.has(key)) {
    charts = JSON.parse(myCache.get(key) as string);
  } else {
    const today = new Date();
    const twelveMonthAgo = new Date();

    twelveMonthAgo.setMonth(today.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthAgo,
        $lte: today,
      },
    };

    const [products, users, orders] = await Promise.all([
      Product.find(baseQuery).select("createdAt"),
      User.find(baseQuery).select("createdAt"),
      Order.find(baseQuery).select(["createdAt", "discount", "total"]),
    ]);

    const productCounts = getChartData({ length: 12, docArr: products, today });

    const userCounts = getChartData({ length: 12, docArr: users, today });

    const discount = getChartData({
      length: 12,
      docArr: orders,
      today,
      property: "discount",
    });

    const revenue = getChartData({
      length: 12,
      docArr: orders,
      today,
      property: "total",
    });

    charts = {
      users: userCounts,
      products: productCounts,
      discount,
      revenue,
    };

    myCache.set(key, JSON.stringify(charts) as string);
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});
