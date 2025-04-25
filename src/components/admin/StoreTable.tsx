"use client"

import { Pencil, Trash2, ExternalLink } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useState } from "react"
import StoreRegistration from "@/pages/StoreRegistration"
import type { RootState } from "@/redux/store"
import { useSelector } from "react-redux"
import { useToast } from "@/hooks/use-toast"
import { userWithOrderDetails } from "@/services2/operations/auth"
import UserDetailsModal from "./user-details-modal"

const StoreTable = ({ loading, groups, fetchStores }: any) => {
  const [isGroupOpen, setIsGroupOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editGroup, setEditGroup] = useState(null)
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [selectedUserData, setSelectedUserData] = useState(null)
  const { toast } = useToast()
  const token = useSelector((state: RootState) => state.auth?.token ?? null)

  const handleEdit = async (group) => {
    setIsEdit(true)
    setEditGroup(group)
    setIsGroupOpen(true)
  }

  const handleDelete = (id: any) => {
    // Implement delete functionality
    toast({
      title: "Delete functionality",
      description: "This feature is not yet implemented",
      variant: "destructive",
    })
  }

  const fetchUserDetailsOrder = async (id: any) => {
    try {
      const res = await userWithOrderDetails(id)
      console.log(res)
      setSelectedUserData(res)
      setUserDetailsOpen(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch user details",
        variant: "destructive",
      })
    }
  }

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
    )
  }

  return (
    <div className="p-4 overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Store List</h2>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-lg shadow-md overflow-x-scroll">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-primary/10 text-gray-900 uppercase text-xs font-medium tracking-wider">
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Store Name</th>
                <th className="px-6 py-4">Owner Name</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groups?.length > 0 ? (
                groups.map((group) => (
                  <tr key={group?.id || group?._id} className="hover:bg-gray-50 transition-colors">
                    <td
                      onClick={() => fetchUserDetailsOrder(group?.id || group?._id)}
                      className="px-6 py-4 cursor-pointer flex items-center gap-1 text-primary hover:underline"
                    >
                      {group?.email ?? "N/A"}
                      <ExternalLink size={14} className="inline-block ml-1" />
                    </td>
                    <td className="px-6 py-4">{group?.phone ?? "N/A"}</td>
                    <td className="px-6 py-4 font-medium">{group?.storeName ?? "N/A"}</td>
                    <td className="px-6 py-4">{group?.ownerName ?? "N/A"}</td>
                    <td className="px-6 py-4 max-w-[200px] truncate" title={group?.address ?? "N/A"}>
                      {group?.address ?? "N/A"}
                    </td>
                    <td className="px-6 py-4">{group?.city ?? "N/A"}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => handleEdit(group)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="Edit store"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(group.id || group._id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete store"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No stores found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {renderStoreRegistrationModal()}

      <UserDetailsModal
        isOpen={userDetailsOpen}
        onClose={() => setUserDetailsOpen(false)}
        userData={selectedUserData}
        fetchUserDetailsOrder={fetchUserDetailsOrder}
      />
    </div>
  )
}

export default StoreTable
