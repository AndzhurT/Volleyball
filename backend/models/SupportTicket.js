const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
    {
        subject: { type: String, trim: true, maxlength: 200, required: true },
        description: { type: String, trim: true, maxlength: 5000, required: true },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['open', 'in-progress', 'resolved', 'closed'],
            default: 'open',
            required: true,
        },
    },
    { timestamps: true },
);

supportTicketSchema.index({ requestedBy: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
