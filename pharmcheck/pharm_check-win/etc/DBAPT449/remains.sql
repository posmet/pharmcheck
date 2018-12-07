SELECT
/* 0 */ lbg.[Goods_ID]                    as product_id
/* 1 */ ,rg.[RGo_Name]                    as product_name
/* 2 */ ,bp.[Barcode_Original]            as product_barcode
/* 3 */ ,(sum(wt.[Debet] - wt.[Credit]))  as product_amount
  FROM
      [dbo].[Warehouse_Transaction] as wt
      INNER JOIN [dbo].[Link_Barcode_Goods] as lbg on wt.[Barcode_Goods_ID] = lbg.[Barcode_Goods_ID]
      INNER JOIN [dbo].[Barcode_Property] as bp on lbg.[Barcode_Property_ID] = bp.[Barcode_Property_ID]
      INNER JOIN [dbo].[ref_Goods] as rg on lbg.[Goods_ID] = rg.[Goods_ID]
  WHERE
      wt.[Transaction_Date] < :start_date and
      bp.[Barcode_Original] is not NULL and
      lbg.[Goods_ID] in ( :product_filter )
  GROUP BY
      lbg.[Goods_ID]
      ,bp.[Barcode_Original]
      ,rg.[RGo_Name]
