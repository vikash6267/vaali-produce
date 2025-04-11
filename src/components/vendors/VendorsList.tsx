import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllVendorsAPI } from '@/services2/operations/vendor';

const VendorsList = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorTypeFilter, setVendorTypeFilter] = useState('all');

  useEffect(() => {
    const fetchVendors = async () => {
      const data = await getAllVendorsAPI();
      console.log(data)
      setVendors(data);
    };
    fetchVendors();
  }, []);

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = vendorTypeFilter === 'all' || vendor.type === vendorTypeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Vendors</CardTitle>
        <CardDescription>
          Manage your vendors, farmers, and suppliers
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={vendorTypeFilter} onValueChange={setVendorTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Vendor Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="farmer">Farmers</SelectItem>
              <SelectItem value="supplier">Suppliers</SelectItem>
              <SelectItem value="distributor">Distributors</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/vendors/new-vendor')} className="shrink-0">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Products</TableHead>
              {/* <TableHead>Status</TableHead> */}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No vendors found. Try adjusting your filters or add a new vendor.
                </TableCell>
              </TableRow>
            ) : (
              filteredVendors.map((vendor) => (
                <TableRow key={vendor._id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{vendor.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>{vendor.contactName}</div>
                    <div className="text-sm text-muted-foreground">{vendor.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {Array.isArray(vendor.productsSupplied) ? vendor.productsSupplied.join(', ') : vendor.productsSupplied}
                    </div>
                  </TableCell>
                  {/* <TableCell>
                    <Badge variant={vendor.activeStatus === 'active' ? 'default' : 'secondary'}>
                      {vendor.activeStatus}
                    </Badge>
                  </TableCell> */}
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/vendors/edit/${vendor._id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default VendorsList;
