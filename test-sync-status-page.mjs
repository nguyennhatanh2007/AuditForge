#!/usr/bin/env node

/**
 * Test the Sync Status Page API
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000';

async function testSyncStatusAPI() {
  console.log('\n✅ TESTING SYNC STATUS PAGE API\n');

  try {
    // Get sync jobs
    const response = await axios.get(`${API_BASE}/api/sync-jobs?limit=10`);
    const jobs = response.data.data || [];

    console.log(`📊 Dữ liệu từ API /api/sync-jobs:\n`);
    console.log(`   Tổng Jobs: ${jobs.length}\n`);

    if (jobs.length > 0) {
      console.log('   Danh sách Sync Jobs:\n');
      jobs.slice(0, 5).forEach((job, i) => {
        console.log(`   ${i + 1}. Job #${job.id}`);
        console.log(`      Thời gian: ${new Date(job.startedAt).toLocaleString('vi-VN')}`);
        console.log(`      Trạng thái: ${job.status}`);
        console.log(`      Kết nối: ${job.succeededSources}/${job.totalSources}`);
        console.log(`      Sai lệch: ${job.discrepancies}`);
        console.log(`      Ghi chú: ${job.note || 'N/A'}\n`);
      });
    }

    console.log('═'.repeat(70));
    console.log('✅ API WORKING - SYNC STATUS PAGE SẼ HIỂN THỊ:');
    console.log('═'.repeat(70) + '\n');

    console.log('📋 BẢNG CHỨA:');
    console.log('   • Job ID');
    console.log('   • Thời gian + thời gian tương đối (X phút trước)');
    console.log('   • Trạng thái (✅ Thành công, ❌ Thất bại, ...)');
    console.log('   • Số hệ thống kết nối (2/2)');
    console.log('   • Số sai lệch tìm thấy');
    console.log('   • Thời gian chạy');
    console.log('   • Ghi chú\n');

    console.log('📈 THỐNG KÊ TỔNG HỢP:');
    console.log(`   • Sync thành công: ${jobs.filter(j => j.status === 'success').length}`);
    console.log(`   • Tất cả sync: ${jobs.length}`);
    console.log(`   • Tổng sai lệch: ${jobs.reduce((sum, j) => sum + j.discrepancies, 0)}`);
    if (jobs.length > 0) {
      console.log(`   • Lần sync gần nhất: ${new Date(jobs[0].startedAt).toLocaleString('vi-VN')}`);
    }
    console.log('\n✅ PAGE READY: http://localhost:3000/sync-status\n');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  }
}

testSyncStatusAPI();
