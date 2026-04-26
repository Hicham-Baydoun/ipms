export const mockGuardians = [
  {
    id: "guardian-1",
    name: "Jennifer Johnson",
    email: "jennifer.johnson@email.com",
    phone: "+1-555-1001",
    address: "123 Oak Street, Springfield",
    childrenIds: ["user-1", "user-2", "user-11"],
    authorizedPickup: [
      { id: "pickup-1", name: "Jennifer Johnson", relation: "Parent", contact: "+1-555-1001" },
      { id: "pickup-2", name: "Mark Johnson", relation: "Parent", contact: "+1-555-1002" },
      { id: "pickup-3", name: "Susan Miller", relation: "Grandparent", contact: "+1-555-1003" }
    ],
    registrationDate: "2023-06-15"
  },
  {
    id: "guardian-2",
    name: "Amanda Williams",
    email: "amanda.williams@email.com",
    phone: "+1-555-2001",
    address: "456 Maple Avenue, Springfield",
    childrenIds: ["user-3", "user-4", "user-12"],
    authorizedPickup: [
      { id: "pickup-4", name: "Amanda Williams", relation: "Parent", contact: "+1-555-2001" },
      { id: "pickup-5", name: "Thomas Williams", relation: "Parent", contact: "+1-555-2002" },
      { id: "pickup-6", name: "Lisa Williams", relation: "Grandparent", contact: "+1-555-2003" }
    ],
    registrationDate: "2023-08-22"
  },
  {
    id: "guardian-3",
    name: "Rachel Brown",
    email: "rachel.brown@email.com",
    phone: "+1-555-3001",
    address: "789 Pine Road, Springfield",
    childrenIds: ["user-5", "user-6", "user-13"],
    authorizedPickup: [
      { id: "pickup-7", name: "Rachel Brown", relation: "Parent", contact: "+1-555-3001" },
      { id: "pickup-8", name: "David Brown", relation: "Parent", contact: "+1-555-3002" },
      { id: "pickup-9", name: "Emily Brown", relation: "Sibling", contact: "+1-555-3003" }
    ],
    registrationDate: "2023-09-10"
  },
  {
    id: "guardian-4",
    name: "Michelle Davis",
    email: "michelle.davis@email.com",
    phone: "+1-555-4001",
    address: "321 Elm Drive, Springfield",
    childrenIds: ["user-7", "user-8", "user-14"],
    authorizedPickup: [
      { id: "pickup-10", name: "Michelle Davis", relation: "Parent", contact: "+1-555-4001" },
      { id: "pickup-11", name: "James Davis", relation: "Parent", contact: "+1-555-4002" },
      { id: "pickup-12", name: "Karen Smith", relation: "Other", contact: "+1-555-4003" }
    ],
    registrationDate: "2023-11-05"
  },
  {
    id: "guardian-5",
    name: "Laura Miller",
    email: "laura.miller@email.com",
    phone: "+1-555-5001",
    address: "654 Birch Lane, Springfield",
    childrenIds: ["user-9", "user-10", "user-15"],
    authorizedPickup: [
      { id: "pickup-13", name: "Laura Miller", relation: "Parent", contact: "+1-555-5001" },
      { id: "pickup-14", name: "Robert Miller", relation: "Parent", contact: "+1-555-5002" },
      { id: "pickup-15", name: "Nancy Johnson", relation: "Grandparent", contact: "+1-555-5003" }
    ],
    registrationDate: "2024-01-18"
  }
];
