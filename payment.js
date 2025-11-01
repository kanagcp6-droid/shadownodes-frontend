// Payment Configuration
// UPDATE THIS URL to your Pterodactyl server URL
const BACKEND_URL = 'http://34.131.136.146';

// For testing locally:
// const BACKEND_URL = 'http://localhost:3000';

// For production with domain:
// const BACKEND_URL = 'https://api.yourdomain.com';

// Initialize Razorpay Payment
async function initializePayment(planDetails) {
    try {
        // Show loading
        showLoading();

        // Create order on backend
        const response = await fetch(`${BACKEND_URL}/api/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: planDetails.amount,
                planName: planDetails.planName,
                planType: planDetails.planType,
                customerEmail: planDetails.customerEmail || '',
                customerName: planDetails.customerName || '',
                customerPhone: planDetails.customerPhone || ''
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to create order');
        }

        // Hide loading
        hideLoading();

        // Razorpay options
        const options = {
            key: data.key,
            amount: data.amount,
            currency: data.currency,
            name: 'ShadowNodes',
            description: `${planDetails.planName} - ${planDetails.planType}`,
            image: 'https://i.imgur.com/3g7nmJC.png', // Add your logo URL
            order_id: data.orderId,
            handler: function (response) {
                verifyPayment(response);
            },
            prefill: {
                name: planDetails.customerName || '',
                email: planDetails.customerEmail || '',
                contact: planDetails.customerPhone || ''
            },
            notes: {
                plan: planDetails.planName,
                type: planDetails.planType
            },
            theme: {
                color: '#0ea5e9'
            },
            // UPI Payment Methods
            method: {
                upi: true,      // Enable UPI
                card: true,     // Enable Card
                netbanking: true, // Enable Netbanking
                wallet: true    // Enable Wallets
            },
            config: {
                display: {
                    blocks: {
                        upi: {
                            name: 'Pay using UPI',
                            instruments: [
                                {
                                    method: 'upi'
                                }
                            ]
                        }
                    },
                    sequence: ['block.upi'],  // Show UPI first
                    preferences: {
                        show_default_blocks: true
                    }
                }
            },
            modal: {
                ondismiss: function() {
                    hideLoading();
                    alert('Payment cancelled. Please try again!');
                }
            }
        };

        // Open Razorpay checkout
        const rzp = new Razorpay(options);
        rzp.open();

        // Handle payment failures
        rzp.on('payment.failed', function (response) {
            hideLoading();
            alert('Payment Failed! Please try again.');
            console.error('Payment Error:', response.error);
        });

    } catch (error) {
        hideLoading();
        alert('Error: ' + error.message);
        console.error('Payment Error:', error);
    }
}

// Verify payment on backend
async function verifyPayment(paymentData) {
    try {
        showLoading('Verifying payment...');

        const response = await fetch(`${BACKEND_URL}/api/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                razorpay_order_id: paymentData.razorpay_order_id,
                razorpay_payment_id: paymentData.razorpay_payment_id,
                razorpay_signature: paymentData.razorpay_signature
            })
        });

        const data = await response.json();
        hideLoading();

        if (data.success) {
            // Payment successful
            showSuccessMessage(data.order);
        } else {
            alert('Payment verification failed! Please contact support.');
        }

    } catch (error) {
        hideLoading();
        alert('Error verifying payment: ' + error.message);
        console.error('Verification Error:', error);
    }
}

// Show success message
function showSuccessMessage(order) {
    const message = `
        🎉 Payment Successful! 🎉
        
        Order ID: ${order.orderId}
        Plan: ${order.planName}
        Amount: ₹${order.amount}
        
        We will contact you shortly on Discord or Email to activate your service!
        Thank you for choosing ShadowNodes! 🚀
    `;
    alert(message);
    
    // Redirect to Discord or success page
    setTimeout(() => {
        window.location.href = 'https://discord.gg/RT8Z43PR';
    }, 2000);
}

// Loading overlay functions
function showLoading(message = 'Processing payment...') {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            flex-direction: column;
            gap: 20px;
        ">
            <div style="
                width: 50px;
                height: 50px;
                border: 4px solid rgba(14, 165, 233, 0.3);
                border-top-color: #0ea5e9;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <p style="color: white; font-size: 18px; font-weight: 600;">${message}</p>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Example: Add click handlers to all Buy Now buttons
document.addEventListener('DOMContentLoaded', () => {
    const buyButtons = document.querySelectorAll('.plan-btn');
    
    buyButtons.forEach(button => {
        // Only add payment handler if not a Discord link
        if (!button.href || !button.href.includes('discord')) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get plan details from the card
                const card = button.closest('.price-card');
                const planName = card.querySelector('.plan-name').textContent;
                const amount = parseInt(card.querySelector('.amount').textContent);
                
                // Determine plan type from section
                let planType = 'minecraft';
                const section = button.closest('section');
                if (section.id === 'bothost') planType = 'bothost';
                if (section.id === 'vps') planType = 'vps';
                
                // Get customer details (you can add a form for this)
                const customerName = prompt('Enter your name:');
                if (!customerName) return;
                
                const customerEmail = prompt('Enter your email:');
                if (!customerEmail) return;
                
                const customerPhone = prompt('Enter your phone number (optional):') || '';
                
                // Initialize payment
                initializePayment({
                    planName: planName,
                    amount: amount,
                    planType: planType,
                    customerName: customerName,
                    customerEmail: customerEmail,
                    customerPhone: customerPhone
                });
            });
        }
    });
});

console.log('💳 Payment Integration Loaded!');
