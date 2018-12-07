SELECT
     [ref_Goods].[Goods_ID]
    ,[ref_Goods].[RGo_Name]
    ,[ref_Producer].[RPr_Name]
   ,0 AS [Barcode_Original]
  FROM [dbo].[ref_Goods]
  INNER JOIN [dbo].[ref_Producer] on [ref_Goods].[Producer_ID] = [ref_Producer].[Producer_ID]
  WHERE ( [RGo_Name] like :search_pattern or [RPr_Name] like :search_pattern )
  GROUP BY
     [ref_Goods].[Goods_ID]
    ,[ref_Goods].[RGo_Name]
    ,[ref_Producer].[RPr_Name]
  ORDER BY
     [ref_Goods].[Goods_ID]
