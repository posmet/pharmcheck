SELECT
/* 0 */ bh.[Bill_Date]                  as bill_date
/* 1 */ ,lbg.[Goods_ID]                 as product_id
/* 2 */ ,rg.[RGo_Name]                  as product_name
/* 3 */ ,bp.[Barcode_Original]          as product_barcode
/* 4 */ ,bb.[Quantity] /* / lbg.[Divisor] */ as product_amount
/* 5 */ ,lbg.[Price_Retail_NDS]         as product_price
/* 6 */ ,bb.[Price_Retail_NDS]          as bill_price
/* 7 */ ,bh.[Cash_Bill_ID]              as bill_id
/* 8 */ ,(SELECT count(1)
            FROM [dbo].[Bill_Body] as bb
            WHERE bh.[Bill_Header_ID] = bb.[Bill_Header_ID]) as bill_items
/* 9 */ ,bh.[Total_Money]               as bill_total
  FROM
      [dbo].[Bill_Header] as bh
      INNER JOIN [dbo].[Bill_Body] as bb on bh.[Bill_Header_ID] = bb.[Bill_Header_ID]
      INNER JOIN [dbo].[Link_Barcode_Goods] as lbg on bb.[Barcode_Goods_ID] = lbg.[Barcode_Goods_Id]
      INNER JOIN [dbo].[ref_Goods] as rg on lbg.[Goods_ID] = rg.[Goods_ID]
      INNER JOIN [dbo].[Barcode_Property] as bp on lbg.[Barcode_Property_ID] = bp.[Barcode_Property_ID] and bp.[Barcode_Original] is not NULL
  WHERE
      bh.[Bill_Date] >= :start_date and bh.[Bill_Date] < :end_date and lbg.[Goods_ID] in ( :product_filter )
