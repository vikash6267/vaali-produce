
import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "../ui/dialog";
import { useState } from "react";
import StoreRegistration from "@/pages/StoreRegistration";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { updateStoreAPI } from "@/services2/operations/auth";
import { useToast } from "@/hooks/use-toast";

const StoreTable = ({ loading, groups, fetchStores }: any) => {
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const { toast } = useToast();
  const token = useSelector((state: RootState) => state.auth?.token ?? null);

  const handleEdit = async (group) => {
    setIsEdit(true);
    setEditGroup(group);
    setIsGroupOpen(true);
  };

  const handleDelete = (id) => {
    // Implement delete functionality
    toast({
      title: "Delete functionality",
      description: "This feature is not yet implemented",
      variant: "destructive",
    });
  };

  const renderStoreRegistrationModal = () => {
    return (
      <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <StoreRegistration
            setIsGroupOpen={(value: boolean) => setIsGroupOpen(value)}
            isEdit={isEdit}
            groups={editGroup}
            fetchStores={fetchStores}
          />
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="p-4 overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Store List</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="w-full overflow-hidden rounded-lg shadow-md">
          <table className="w-full border-collapse border border-gray-300 text-left">
            <thead>
              <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
                <th className="border p-3">Email</th>
                <th className="border p-3">Phone</th>
                <th className="border p-3">Store Name</th>
                <th className="border p-3">Owner Name</th>
                <th className="border p-3">Address</th>
                <th className="border p-3">City</th>
                <th className="border p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groups?.length > 0 ? (
                groups.map((group) => (
                  <tr key={group?.id} className="hover:bg-gray-100">
                    <td className="border p-3">{group?.email ?? "N/A"}</td>
                    <td className="border p-3">{group?.phone ?? "N/A"}</td>
                    <td className="border p-3">{group?.storeName ?? "N/A"}</td>
                    <td className="border p-3">{group?.ownerName ?? "N/A"}</td>
                    <td className="border p-3">{group?.address ?? "N/A"}</td>
                    <td className="border p-3">{group?.city ?? "N/A"}</td>
                    <td className="border p-3 flex justify-center space-x-3">
                      <button
                        onClick={() => handleEdit(group)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="border p-3 text-center">
                    No stores found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {renderStoreRegistrationModal()}
    </div>
  );
};

export default StoreTable;
