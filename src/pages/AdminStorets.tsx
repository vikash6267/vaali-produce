
import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import StoreRegistration from "./StoreRegistration";
import { getAllMembersAPI,userWithOrderDetails } from "@/services2/operations/auth";
import StoreTable from "@/components/admin/StoreTable";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const AdminStorets = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState([]);
  const user = useSelector((state: RootState) => state.auth?.user ?? null);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const data = await getAllMembersAPI();
      const filteredData = data.filter((store) => store.role === "store");

      const formattedData = filteredData.map(({ _id, ...rest }) => ({
        id: _id,
        ...rest,
      }));

      setGroup(formattedData);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch groups on component mount
  useEffect(() => {
    fetchStores();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };



  return (
    <div>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="page-container max-w-full px-4 py-4">
              <PageHeader
                title="Store Management"
                description="Manage stores, verify stores, and give permissions"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => setIsGroupOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Add Store
                  </Button>
                </div>
              </PageHeader>

              <Tabs defaultValue="orders" className="mt-6">
                <TabsContent value="orders">
                  <StoreTable
                    loading={loading}
                    groups={group}
                    fetchStores={fetchStores}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
      <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Add New Store
            </DialogTitle>
          </DialogHeader>
          <StoreRegistration
            setIsGroupOpen={(value: boolean) => setIsGroupOpen(value)}
            isEdit={false}
            groups={null}
            fetchStores={fetchStores}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStorets;
