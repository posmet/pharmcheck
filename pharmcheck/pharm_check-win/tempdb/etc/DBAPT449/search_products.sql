SELECT
     [ref_Goods].[Goods_ID]
    ,[ref_Goods].[RGo_Name]
    ,[ref_Producer].[RPr_Name]
    ,[Barcode_Property].[Barcode_Original]
  FROM [dbo].[ref_Goods]
  INNER JOIN [dbo].[ref_Producer] on [ref_Goods].[Producer_ID] = [ref_Producer].[Producer_ID]
  INNER JOIN [dbo].[Link_Barcode_Goods] on [ref_Goods].[Goods_ID] = [Link_Barcode_Goods].[Goods_ID]
  INNER JOIN [dbo].[Barcode_Property] on [Link_Barcode_Goods].[Barcode_Property_ID] = [Barcode_Property].[Barcode_Property_ID]
  WHERE [Barcode_Original] is not NULL and ( [RGo_Name] like :search_pattern or [RPr_Name] like :search_pattern )
  GROUP BY
     [ref_Goods].[Goods_ID]
    ,[ref_Goods].[RGo_Name]
    ,[ref_Producer].[RPr_Name]
    ,[Barcode_Property].[Barcode_Original]
  ORDER BY
     [ref_Goods].[Goods_ID]
