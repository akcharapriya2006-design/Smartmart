import uuid
from typing import Dict, Any, Tuple
from app.models.order import PaymentMethod, PaymentStatus

class PaymentService:
    @staticmethod
    def process_simulated_payment(
        payment_method: PaymentMethod,
        amount: float,
        details: Dict[str, Any] = None
    ) -> Tuple[PaymentStatus, str]:
        """
        Simulate payment gateway processing for cards, UPI, or cash.
        Returns (PaymentStatus, payment_reference).
        """
        short_id = uuid.uuid4().hex[:8].upper()

        if payment_method == PaymentMethod.SIMULATED_CARD:
            # Simulate credit/debit card validation
            card_num = (details or {}).get("card_number", "4111111111111111").replace(" ", "").replace("-", "")
            # If card ends with 0000, simulate a decline for testing
            if card_num.endswith("0000"):
                return PaymentStatus.FAILED, f"DECLINED-CARD-{short_id}"
            return PaymentStatus.PAID, f"TXN-CARD-{short_id}"

        elif payment_method == PaymentMethod.SIMULATED_UPI:
            upi_id = (details or {}).get("upi_id", "user@smartmart")
            # If UPI is fail@upi, simulate failure for testing
            if "fail" in upi_id.lower():
                return PaymentStatus.FAILED, f"FAILED-UPI-{short_id}"
            return PaymentStatus.PAID, f"TXN-UPI-{short_id}"

        elif payment_method in (PaymentMethod.CASH_ON_DELIVERY, PaymentMethod.CASH_ON_PICKUP):
            return PaymentStatus.PENDING, f"CASH-REF-{short_id}"

        return PaymentStatus.PAID, f"TXN-GEN-{short_id}"

payment_service = PaymentService()
