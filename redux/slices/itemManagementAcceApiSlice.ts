import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ItemAcceApiSlice = createApi({
  reducerPath: 'ItemAcceApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://suranga-cellcare-inventory.netlify.app/api/' }),
  tagTypes: ['ItemAcce'],
  endpoints: (builder) => ({
    // Read: Fetch all categories
    getItemAcces: builder.query({
      query: () => 'itemManagementAcce/route',
      providesTags: ['ItemAcce'],
    }),
    // Fetch a single category by ID
    getItemAcceById: builder.query({
      query: (id) => `itemManagementAcce/${id}`,
      providesTags: ['ItemAcce'],
    }),
    getDeleteItemAcces: builder.query({
      query: () => 'itemManagementAcce/bin',
      providesTags: ['ItemAcce'],
    }),
    addItemAcce: builder.mutation({
      query: (newItemAcce) => ({
        url: 'itemManagementAcce/route',
        method: 'POST',
        body: newItemAcce,
      }),
      invalidatesTags: ['ItemAcce'],
    }),
    updateItemAcce: builder.mutation({
      query: (updatedItemAcce) => ({
        url: `itemManagementAcce/${updatedItemAcce.id}`,
        method: 'PUT',
        body: updatedItemAcce,
      }),
      invalidatesTags: ['ItemAcce'],
    }),
    deleteItemAcce: builder.mutation({
      query: (id) => ({
        url: `itemManagementAcce/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetItemAccesQuery,
  useGetItemAcceByIdQuery, // New hook to fetch single category
  useGetDeleteItemAccesQuery,
  useAddItemAcceMutation,
  useUpdateItemAcceMutation,
  useDeleteItemAcceMutation,
} = ItemAcceApiSlice;