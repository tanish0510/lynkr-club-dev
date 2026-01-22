import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Mail, Package } from 'lucide-react';
import api from '@/utils/api';

const PartnerOrdersPage = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('status')?.toLowerCase() || 'all');
  const [acknowledging, setAcknowledging] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? '' : activeTab.toUpperCase();
      const response = await api.get(`/partner/orders${status ? `?status=${status}` : ''}`);
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (orderId) => {
    setAcknowledging(orderId);
    try {
      await api.post(`/partner/acknowledge-order/${orderId}`);
      toast.success('Order acknowledged successfully! User has been credited points.');
      await fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to acknowledge order');
    } finally {
      setAcknowledging(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACKNOWLEDGED':
        return <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm font-medium"><CheckCircle2 className="w-4 h-4" />Acknowledged</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-sm font-medium"><Clock className="w-4 h-4" />Pending</span>;
      case 'DISPUTED':
        return <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-sm font-medium">Disputed</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-500 px-3 py-1 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  const OrderCard = ({ order }) => (
    <div className="bg-secondary/30 rounded-2xl p-6 hover:bg-secondary/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-lg">Order #{order.order_id}</h4>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {order.user_lynkr_email}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">₹{order.amount.toLocaleString()}</p>
          {getStatusBadge(order.status)}
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="text-sm text-muted-foreground">
          <p>Created: {new Date(order.created_at).toLocaleString()}</p>
          {order.acknowledged_at && (
            <p>Acknowledged: {new Date(order.acknowledged_at).toLocaleString()}</p>
          )}
        </div>
        
        {order.status === 'PENDING' && (
          <Button
            onClick={() => handleAcknowledge(order.id)}
            disabled={acknowledging === order.id}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6 py-2"
          >
            {acknowledging === order.id ? (
              <>Processing...</>
            ) : (
              <>
                <CheckCircle2 className="mr-2 w-4 h-4" />
                Acknowledge Order
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-heading mb-2">Orders Management</h1>
          <p className="text-muted-foreground">Review and acknowledge orders from Lynkr users</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 bg-secondary/50 rounded-xl p-1">
            <TabsTrigger value="all" className="rounded-lg">All Orders</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
            <TabsTrigger value="acknowledged" className="rounded-lg">Acknowledged</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading orders...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'pending' 
                    ? 'All orders have been acknowledged!'
                    : activeTab === 'acknowledged'
                    ? 'No acknowledged orders yet'
                    : 'No orders received yet'}
                </p>
              </div>
            ) : (
              <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PartnerOrdersPage;
