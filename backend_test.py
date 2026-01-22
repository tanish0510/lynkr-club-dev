import requests
import sys
import json
from datetime import datetime

class LynkrAPITester:
    def __init__(self, base_url="https://emailrewards.preview.emergentagent.com"):
        self.base_url = base_url
        self.user_token = None
        self.partner_token = None
        self.admin_token = None
        self.test_user_id = None
        self.test_partner_id = None
        self.test_purchase_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_user_signup(self):
        """Test user signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"testuser{timestamp}@example.com"
        
        success, response = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "role": "USER"
            }
        )
        
        if success and 'token' in response:
            self.user_token = response['token']
            self.test_user_id = response['user']['id']
            print(f"   User ID: {self.test_user_id}")
            print(f"   Lynkr Email: {response['user']['lynkr_email']}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": "testuser@example.com",
                "password": "TestPass123!"
            }
        )
        return success

    def test_partner_signup(self):
        """Test partner signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"testpartner{timestamp}@example.com"
        
        success, response = self.run_test(
            "Partner Signup",
            "POST",
            "partner/signup",
            200,
            data={
                "business_name": "Test Store",
                "category": "Fashion",
                "website": "https://teststore.com",
                "monthly_orders": 1000,
                "commission_preference": "Revenue Share",
                "contact_email": test_email,
                "password": "TestPass123!"
            }
        )
        
        if success and 'token' in response:
            self.partner_token = response['token']
            self.test_partner_id = response['partner']['id']
            print(f"   Partner ID: {self.test_partner_id}")
            return True
        return False

    def test_admin_signup(self):
        """Test admin signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"testadmin{timestamp}@example.com"
        
        success, response = self.run_test(
            "Admin Signup",
            "POST",
            "auth/signup",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "role": "ADMIN"
            }
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            return True
        return False

    def test_user_me(self):
        """Test get current user info"""
        success, response = self.run_test(
            "Get User Info",
            "GET",
            "user/me",
            200,
            token=self.user_token
        )
        return success

    def test_complete_onboarding(self):
        """Test complete onboarding"""
        success, response = self.run_test(
            "Complete Onboarding",
            "POST",
            "user/complete-onboarding",
            200,
            token=self.user_token
        )
        return success

    def test_user_dashboard(self):
        """Test user dashboard"""
        success, response = self.run_test(
            "User Dashboard",
            "GET",
            "user/dashboard",
            200,
            token=self.user_token
        )
        
        if success:
            print(f"   Points: {response.get('points', 0)}")
            print(f"   Month Spending: {response.get('month_spending', 0)}")
            print(f"   Available Rewards: {len(response.get('available_rewards', []))}")
        return success

    def test_create_purchase(self):
        """Test create purchase"""
        success, response = self.run_test(
            "Create Purchase",
            "POST",
            "purchases",
            200,
            data={
                "brand": "Test Brand",
                "order_id": f"ORDER{datetime.now().strftime('%H%M%S')}",
                "amount": 1500.0
            },
            token=self.user_token
        )
        
        if success and 'id' in response:
            self.test_purchase_id = response['id']
            print(f"   Purchase ID: {self.test_purchase_id}")
            return True
        return False

    def test_get_purchases(self):
        """Test get user purchases"""
        success, response = self.run_test(
            "Get Purchases",
            "GET",
            "purchases",
            200,
            token=self.user_token
        )
        
        if success:
            print(f"   Total Purchases: {len(response)}")
        return success

    def test_ai_insights(self):
        """Test AI insights - this might take longer due to AI processing"""
        print("   Note: AI insights may take a few seconds...")
        success, response = self.run_test(
            "AI Insights",
            "GET",
            "ai/insights",
            200,
            token=self.user_token
        )
        
        if success:
            print(f"   Spending Persona: {response.get('spending_persona', 'N/A')}")
            print(f"   Top Category: {response.get('top_category', 'N/A')}")
            print(f"   Insights Count: {len(response.get('insights', []))}")
        return success

    def test_points_ledger(self):
        """Test points ledger"""
        success, response = self.run_test(
            "Points Ledger",
            "GET",
            "points/ledger",
            200,
            token=self.user_token
        )
        return success

    def test_partner_dashboard(self):
        """Test partner dashboard"""
        success, response = self.run_test(
            "Partner Dashboard",
            "GET",
            "partner/dashboard",
            200,
            token=self.partner_token
        )
        
        if success:
            print(f"   Lynkr Users: {response.get('lynkr_users', 0)}")
            print(f"   Detected Purchases: {response.get('detected_purchases', 0)}")
            print(f"   Verified Purchases: {response.get('verified_purchases', 0)}")
        return success

    def test_admin_get_users(self):
        """Test admin get all users"""
        success, response = self.run_test(
            "Admin Get Users",
            "GET",
            "admin/users",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"   Total Users: {len(response)}")
        return success

    def test_admin_get_partners(self):
        """Test admin get all partners"""
        success, response = self.run_test(
            "Admin Get Partners",
            "GET",
            "admin/partners",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"   Total Partners: {len(response)}")
        return success

    def test_admin_get_purchases(self):
        """Test admin get all purchases"""
        success, response = self.run_test(
            "Admin Get Purchases",
            "GET",
            "admin/purchases",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"   Total Purchases: {len(response)}")
        return success

    def test_admin_verify_purchase(self):
        """Test admin verify purchase"""
        if not self.test_purchase_id:
            print("❌ No purchase ID available for verification test")
            return False
            
        success, response = self.run_test(
            "Admin Verify Purchase",
            "POST",
            f"admin/verify-purchase/{self.test_purchase_id}?action=VERIFY",
            200,
            token=self.admin_token
        )
        return success

    def test_mock_email_ingestion(self):
        """Test mock email ingestion"""
        # First get user info to get lynkr_email
        user_success, user_response = self.run_test(
            "Get User for Email Test",
            "GET",
            "user/me",
            200,
            token=self.user_token
        )
        
        if not user_success:
            return False
            
        lynkr_email = user_response.get('lynkr_email')
        if not lynkr_email:
            print("❌ No Lynkr email found")
            return False
            
        success, response = self.run_test(
            "Mock Email Ingestion",
            "POST",
            "mock/ingest-email",
            200,
            data={
                "lynkr_email": lynkr_email,
                "brand": "Amazon",
                "order_id": f"AMZ{datetime.now().strftime('%H%M%S')}",
                "amount": 2500.0
            }
        )
        
        if success:
            print(f"   Created Purchase ID: {response.get('purchase_id', 'N/A')}")
        return success

    def test_redeem_points(self):
        """Test points redemption"""
        success, response = self.run_test(
            "Redeem Points",
            "POST",
            "points/redeem?reward_id=1&points=100",
            200,
            token=self.user_token
        )
        
        if success:
            print(f"   New Balance: {response.get('new_balance', 'N/A')}")
            print(f"   Coupon Code: {response.get('coupon_code', 'N/A')}")
        return success

def main():
    print("🚀 Starting Lynkr API Testing...")
    print("=" * 60)
    
    tester = LynkrAPITester()
    
    # Test Authentication Flow
    print("\n📝 AUTHENTICATION TESTS")
    print("-" * 30)
    
    if not tester.test_user_signup():
        print("❌ User signup failed, stopping user tests")
        return 1
    
    if not tester.test_partner_signup():
        print("❌ Partner signup failed, stopping partner tests")
        return 1
        
    if not tester.test_admin_signup():
        print("❌ Admin signup failed, stopping admin tests")
        return 1

    # Test User Flow
    print("\n👤 USER FLOW TESTS")
    print("-" * 30)
    
    tester.test_user_me()
    tester.test_complete_onboarding()
    tester.test_user_dashboard()
    tester.test_create_purchase()
    tester.test_get_purchases()
    tester.test_points_ledger()
    
    # Test AI Insights (may take longer)
    print("\n🤖 AI INSIGHTS TEST")
    print("-" * 30)
    tester.test_ai_insights()
    
    # Test Partner Flow
    print("\n🏢 PARTNER FLOW TESTS")
    print("-" * 30)
    tester.test_partner_dashboard()
    
    # Test Admin Flow
    print("\n👑 ADMIN FLOW TESTS")
    print("-" * 30)
    tester.test_admin_get_users()
    tester.test_admin_get_partners()
    tester.test_admin_get_purchases()
    tester.test_admin_verify_purchase()
    
    # Test Mock Services
    print("\n📧 MOCK SERVICES TESTS")
    print("-" * 30)
    tester.test_mock_email_ingestion()
    
    # Test Points Redemption
    print("\n🎁 REWARDS TESTS")
    print("-" * 30)
    tester.test_redeem_points()
    
    # Print Results
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for failed_test in tester.failed_tests:
            print(f"   • {failed_test}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())