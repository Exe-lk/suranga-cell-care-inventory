import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const stockInOutAcceApiSlice = createApi({
  reducerPath: 'stockInOutAcceApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://suranga-cellcare-inventory.netlify.app/api/' }),
  tagTypes: ['StockInOutAcce'],
  endpoints: (builder) => ({
    // Read: Fetch all categories
    getStockInOuts: builder.query({
      query: () => 'stockInOutAcce/route',
      providesTags: ['StockInOutAcce'],
    }),
    // Fetch a single category by ID
    getStockInOutById: builder.query({
      query: (id) => `stockInOutAcce/${id}`,
      providesTags: ['StockInOutAcce'],
    }),
    getDeleteStockInOuts: builder.query({
      query: () => 'stockInOutAcce/bin',
      providesTags: ['StockInOutAcce'],
    }),
    addStockIn: builder.mutation({
      query: (newStockIn) => ({
        url: 'stockInOutAcce/route',
        method: 'POST',
        body: newStockIn,
      }),
      invalidatesTags: ['StockInOutAcce'],
    }),
    addStockOut: builder.mutation({
      query: (newStockOut) => ({
        url: 'stockInOutAcce/route1',
        method: 'POST',
        body: newStockOut,
      }),
      invalidatesTags: ['StockInOutAcce'],
    }),
    updateStockInOut: builder.mutation({
      query: (updatedStockInOut) => ({
        url: `stockInOutAcce/${updatedStockInOut.id}`,
        method: 'PUT',
        body: updatedStockInOut,
      }),
      invalidatesTags: ['StockInOutAcce'],
    }),
    deleteStockInOut: builder.mutation({
      query: (id) => ({
        url: `stockInOutAcce/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGetStockInOutsQuery,
  useGetStockInOutByIdQuery, // New hook to fetch single category
  useGetDeleteStockInOutsQuery,
  useAddStockInMutation,
  useAddStockOutMutation,
  useUpdateStockInOutMutation,
  useDeleteStockInOutMutation,
} = stockInOutAcceApiSlice;