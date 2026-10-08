const express = require('express');
const SupportTicket = require('../models/SupportTicket');
const { protect, admin } = require('../middleware/auth');
const { validateSupportTicketInput } = require('../utils/validation');

const router = express.Router();

function serializeSupportTicket(ticket) {
    return {
        id: String(ticket._id),
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
    };
}

router.post('/', protect, async (req, res, next) => {
    try {
        const { subject, description } = validateSupportTicketInput(req.body);
        const ticket = await SupportTicket.create({
            subject,
            description,
            requestedBy: req.user.id,
        });
        res.status(201).json(serializeSupportTicket(ticket));
    } catch (err) {
        next(err);
    }
});

router.get('/mine', protect, async (req, res, next) => {
    try {
        const tickets = await SupportTicket.find({ requestedBy: req.user.id }).sort({ createdAt: -1 });
        res.json({ data: tickets.map(serializeSupportTicket) });
    } catch (err) {
        next(err);
    }
});

router.get('/', protect, admin, async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
        const filter = {};
        if (['open', 'in-progress', 'resolved', 'closed'].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        const [tickets, total] = await Promise.all([
            SupportTicket.find(filter)
                .populate('requestedBy', '_id username email')
                .sort({ createdAt: 1 })
                .skip((page - 1) * limit)
                .limit(limit),
            SupportTicket.countDocuments(filter),
        ]);

        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: tickets.map((ticket) => ({
                ...serializeSupportTicket(ticket),
                requestedBy: ticket.requestedBy
                    ? {
                          id: String(ticket.requestedBy._id),
                          username: ticket.requestedBy.username,
                          email: ticket.requestedBy.email,
                      }
                    : null,
            })),
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
