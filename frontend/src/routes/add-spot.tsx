import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { apiService } from "@/services/api";

export const Route = createFileRoute("/add-spot")({
  component: AddSpotPage,
});

function AddSpotPage() {
  const [formData, setFormData] = useState({
    spot_name: '',
    spot_type: '',
    short_description: '',
    address: '',
    latitude: '',
    longitude: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Validate required fields
      if (!formData.spot_name || !formData.spot_type) {
        throw new Error('Spot name and type are required');
      }

      const result = await apiService.createSpot(formData);

      if (result.success) {
        setMessage('Spot created successfully!');
        // Reset form
        setFormData({
          spot_name: '',
          spot_type: '',
          short_description: '',
          address: '',
          latitude: '',
          longitude: '',
          status: 'active'
        });
      } else {
        throw new Error(result.error || 'Failed to create spot');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <PlusCircle className="h-12 w-12 text-warm-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Add a Study Spot</h1>
            <p className="text-muted-foreground">
              Know a great place to study? Share it with the MySpot community.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Spot Name */}
              <div className="md:col-span-2">
                <label htmlFor="spot_name" className="block text-sm font-medium text-foreground mb-2">
                  Spot Name *
                </label>
                <input
                  type="text"
                  id="spot_name"
                  name="spot_name"
                  value={formData.spot_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-warm-500 focus:border-transparent"
                  placeholder="e.g., Starbucks Downtown"
                  required
                />
              </div>

              {/* Spot Type */}
              <div>
                <label htmlFor="spot_type" className="block text-sm font-medium text-foreground mb-2">
                  Spot Type *
                </label>
                <select
                  id="spot_type"
                  name="spot_type"
                  value={formData.spot_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-warm-500 focus:border-transparent"
                  required
                >
                  <option value="">Select type</option>
                  <option value="cafe">Cafe</option>
                  <option value="library">Library</option>
                  <option value="park">Park</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="office">Office Building</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-warm-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending Review</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="short_description" className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  id="short_description"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-warm-500 focus:border-transparent"
                  placeholder="Describe the atmosphere, amenities, noise level, etc."
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-warm-500 focus:border-transparent"
                  placeholder="Full address of the location"
                />
              </div>

              {/* Latitude */}
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-foreground mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="any"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-warm-500 focus:border-transparent"
                  placeholder="37.2296"
                />
              </div>

              {/* Longitude */}
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-foreground mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="any"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-warm-500 focus:border-transparent"
                  placeholder="-80.4139"
                />
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">{message}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-warm-500 hover:bg-warm-600 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Creating Spot...' : 'Add Study Spot'}
            </button>
          </form>
        </div>
      </PageContainer>
    </>
  );
}
