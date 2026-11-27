const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Order = require('../models/Order');

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function formatOrderCode(order) {
  return order.orderNumber || `KLM-${order._id.toString().slice(-6).toUpperCase()}`;
}

function buildEmailTemplate({ customerName, orderCode, badgeText, headline, bodyText, ctaLabel, ctaUrl }) {
  return `
    <div style="font-family: Georgia, serif; background-color: #FDFCF5; padding: 32px 16px; color: #333333;">
      <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E6DFD3; border-radius: 16px; overflow: hidden;">
        <div style="background-color: #1A110A; padding: 24px 28px; color: #FFFFFF;">
          <div style="font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">Kilimo Coffee</div>
          <div style="font-size: 12px; color: #66BB6A; margin-top: 4px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">
            ${badgeText} &bull; Order ${orderCode}
          </div>
        </div>
        <div style="padding: 28px; font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="font-family: Georgia, serif; color: #4B3621; margin-top: 0;">${headline}</h2>
          <p style="font-size: 14px; color: #333333;">Hi ${customerName},</p>
          <p style="font-size: 14px; color: #333333;">${bodyText}</p>
          ${
            ctaLabel && ctaUrl
              ? `<div style="margin: 26px 0;">
                   <a href="${ctaUrl}" style="display: inline-block; background-color: #2E7D32; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: bold;">
                     ${ctaLabel}
                   </a>
                 </div>`
              : ''
          }
          <hr style="border: none; border-top: 1px solid #EFECE1; margin: 24px 0;" />
          <p style="font-size: 12px; color: #777777; margin: 0;">
            Kilimo Coffee &amp; News &bull; Farm-Direct Kenyan Arabica
          </p>
        </div>
      </div>
    </div>
  `;
}

async function sendMailSafe({ to, subject, html }) {
  if (!to) return;
  const transporter = createTransporter();
  if (!transporter) {
    console.warn(`[Email skipped - SMTP not configured] To: ${to} | Subject: ${subject}`);
    return;
  }

  const fromAddress = process.env.SMTP_FROM || `"Kilimo Coffee" <${process.env.SMTP_USER}>`;
  await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html
  });
}

async function sendOrderStatusEmail(order, stage) {
  const recipient = order?.customer?.email;
  if (!recipient) return;

  const customerName = order.customer.fullName || 'Coffee Lover';
  const orderCode = formatOrderCode(order);
  const storeUrl = (process.env.FRONTEND_URL || 'https://kilimonews.co.ke').replace(/\/+$/, '');
  const normalizedStage = (stage || '').toLowerCase().trim();

  let payload = null;

  if (normalizedStage === 'confirmed' || normalizedStage === 'pending') {
    payload = {
      subject: `Order Confirmed (${orderCode}) — Kilimo Coffee`,
      badgeText: 'Order Confirmed',
      headline: 'We have received your coffee order!',
      bodyText: `Thank you for ordering from Kilimo Coffee. Your order <strong>${orderCode}</strong> (Total: <strong>KES ${Number(order.totalAmount).toLocaleString()}</strong>) is confirmed and queued for roasting and packing.`,
      ctaLabel: 'Browse More Kenyan Lots',
      ctaUrl: `${storeUrl}/purchase-coffee`
    };
  } else if (normalizedStage === 'prepared' || normalizedStage === 'preparing') {
    payload = {
      subject: `Your Coffee is Prepared (${orderCode}) — Kilimo Coffee`,
      badgeText: 'Order Prepared',
      headline: 'Freshly packed and ready for dispatch',
      bodyText: `Your single-origin Kenyan coffee for order <strong>${orderCode}</strong> has been freshly prepared, sealed, and staged for our rider to pick up.`,
      ctaLabel: 'Visit Kilimo Coffee',
      ctaUrl: storeUrl
    };
  } else if (
    normalizedStage === 'on the way' ||
    normalizedStage === 'out for delivery' ||
    normalizedStage === 'dispatched' ||
    normalizedStage === 'in transit'
  ) {
    payload = {
      subject: `Rider On The Way (${orderCode}) — Kilimo Coffee`,
      badgeText: 'Rider Dispatched',
      headline: 'Your coffee rider is on the way!',
      bodyText: `Our dispatch rider has picked up order <strong>${orderCode}</strong> and is heading to <strong>${order.customer.deliveryLocation}, ${order.customer.county}</strong>. Please keep your phone (${order.customer.phone}) reachable.`,
      ctaLabel: order.customer.mapsUrl ? 'View Pinned Drop-Off Location' : null,
      ctaUrl: order.customer.mapsUrl || null
    };
  } else if (normalizedStage === 'delivered') {
    payload = {
      subject: `Order Delivered (${orderCode}) — Enjoy Your Brew!`,
      badgeText: 'Delivered',
      headline: 'Your Kilimo Coffee has arrived',
      bodyText: `Order <strong>${orderCode}</strong> has been marked as delivered. Thank you for supporting Kenyan coffee farmers and cooperatives—we hope you enjoy every cup!`,
      ctaLabel: 'Order Again',
      ctaUrl: `${storeUrl}/purchase-coffee`
    };
  }

  if (!payload) return;

  try {
    await sendMailSafe({
      to: recipient,
      subject: payload.subject,
      html: buildEmailTemplate({
        customerName,
        orderCode,
        ...payload
      })
    });
  } catch (err) {
    console.error(`Failed sending "${stage}" email for ${orderCode}:`, err.message);
  }
}

async function sendTwoHourReviewEmail(order) {
  const recipient = order?.customer?.email;
  if (!recipient) return;

  const customerName = order.customer.fullName || 'Coffee Lover';
  const orderCode = formatOrderCode(order);
  const storeUrl = (process.env.FRONTEND_URL || 'https://kilimonews.co.ke').replace(/\/+$/, '');

  await sendMailSafe({
    to: recipient,
    subject: `How was your Kilimo Coffee? (${orderCode})`,
    html: buildEmailTemplate({
      customerName,
      orderCode,
      badgeText: 'Share Your Feedback',
      headline: 'How is your cup tasting?',
      bodyText: `It has been two hours since order <strong>${orderCode}</strong> arrived. We would love to hear what you think of the roast, aroma, and delivery experience.`,
      ctaLabel: 'Leave a Product Review',
      ctaUrl: `${storeUrl}/purchase-coffee?review=${encodeURIComponent(orderCode)}`
    })
  });
}

// Runs every 10 minutes to send the 2-hour post-delivery review email reliably across restarts
function startReviewEmailCron() {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const dueOrders = await Order.find({
        status: 'Delivered',
        reviewEmailSent: { $ne: true },
        deliveredAt: { $ne: null, $lte: twoHoursAgo }
      });

      for (const order of dueOrders) {
        try {
          await sendTwoHourReviewEmail(order);
          order.reviewEmailSent = true;
          await order.save();
        } catch (err) {
          console.error(`Failed 2-hour review email for order ${order._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('Review email cron error:', err.message);
    }
  });
}

module.exports = {
  sendOrderStatusEmail,
  startReviewEmailCron
};
